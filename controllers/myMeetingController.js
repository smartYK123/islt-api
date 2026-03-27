const Event = require('../models/myMeeting');
// const Lsdc = require('../models/lsdc');
const Programs = require('../models/specialContent');
const { v4: uuidv4 } = require('uuid');
// const { PDFDocument } = require('pdf-lib');
const { PDFDocument, rgb } = require('pdf-lib'); // Import rgb from pdf-lib
// const { Lsdc, DeptAccess } = require('../models/lsdc'); // Updated import
const Lsdc  = require("../models/user")
const fs = require('fs').promises;
// const PDFDocument = require('pdfkit');
// const fs = require('fs'); // Note: Not used in this code, can be removed
const mongoose = require('mongoose');
// POST an event
// POST an event


// Add modules to a course series in a meeting
exports.addModulesToCourseSeries = async (req, res) => {
  try {
    const { meetingId, seriesTitle, modules } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({ error: 'Invalid meetingId' });
    }
    if (!seriesTitle || !Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ error: 'seriesTitle and a non-empty modules array are required' });
    }
    for (const module of modules) {
      if (!module.name || typeof module.name !== 'string') {
        return res.status(400).json({ error: 'Each module must have a valid name' });
      }
    }

    // Find the meeting
    const meeting = await Event.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Find the course series
    const series = meeting.courseSeries.find(s => s.title === seriesTitle);
    if (!series) {
      return res.status(404).json({ error: `Series '${seriesTitle}' not found in meeting` });
    }

    // Check for duplicate module names
    const existingModuleNames = series.modules.map(m => m.name);
    const newModules = modules.filter(module => !existingModuleNames.includes(module.name));

    if (newModules.length === 0) {
      return res.status(400).json({ error: 'All provided modules already exist in the series' });
    }

    // Add new modules to the series
    series.modules.push(...newModules.map(module => ({
      name: module.name,
      thumbnail: module.thumbnail || '',
      content: module.content || ''
    })));

    await meeting.save();

    res.status(200).json({
      message: `Added ${newModules.length} new modules to series '${seriesTitle}'`,
      meetingId,
      seriesTitle,
      addedModules: newModules
    });
  } catch (error) {
    console.error('Error in addModulesToCourseSeries:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Add modules to a user's enrollment in a meeting
exports.addModulesToUserEnrollment = async (req, res) => {
  try {
    const { meetingId, userId, seriesTitle, moduleNames } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(meetingId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid meetingId or userId' });
    }
    if (!seriesTitle || !Array.isArray(moduleNames) || moduleNames.length === 0) {
      return res.status(400).json({ error: 'seriesTitle and a non-empty moduleNames array are required' });
    }

    // Find the meeting
    const meeting = await Event.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Find the course series to validate available modules
    const series = meeting.courseSeries.find(s => s.title === seriesTitle);
    if (!series) {
      return res.status(404).json({ error: `Series '${seriesTitle}' not found in meeting` });
    }

    // Validate module names against course series
    const availableModules = series.modules.map(m => m.name);
    const invalidModules = moduleNames.filter(name => !availableModules.includes(name));
    if (invalidModules.length > 0) {
      return res.status(400).json({ error: `Invalid module names: ${invalidModules.join(', ')}` });
    }

    // Find user enrollment
    let userEnrollment = meeting.enrolledModules.find(
      em => em.userId.toString() === userId
    );
    if (!userEnrollment) {
      // Create new enrollment if user is not enrolled
      userEnrollment = {
        userId,
        enrolledSeries: [],
        createdAt: new Date()
      };
      meeting.enrolledModules.push(userEnrollment);
    }

    // Find or create the enrolled series
    let enrolledSeries = userEnrollment.enrolledSeries.find(
      s => s.seriesTitle === seriesTitle
    );
    if (!enrolledSeries) {
      enrolledSeries = {
        seriesTitle,
        modules: [],
        certificate: {}
      };
      userEnrollment.enrolledSeries.push(enrolledSeries);
    }

    // Check for already enrolled modules
    const existingModuleNames = enrolledSeries.modules.map(m => m.name);
    const newModuleNames = moduleNames.filter(name => !existingModuleNames.includes(name));
    if (newModuleNames.length === 0) {
      return res.status(400).json({ error: 'All specified modules are already enrolled' });
    }

    // Add new modules to enrolled series
    const newModules = newModuleNames.map(name => {
      const courseModule = series.modules.find(m => m.name === name);
      return {
        name,
        thumbnail: courseModule.thumbnail || '',
        content: courseModule.content || '',
        watchProgress: { completed: false, completionDate: null },
        comments: [],
        likes: []
      };
    });
    enrolledSeries.modules.push(...newModules);

    await meeting.save();

    res.status(200).json({
      message: `Added ${newModules.length} new modules to user enrollment in series '${seriesTitle}'`,
      meetingId,
      userId,
      seriesTitle,
      addedModules: newModuleNames
    });
  } catch (error) {
    console.error('Error in addModulesToUserEnrollment:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

exports.updateEnrolledModuleContent = async (req, res) => {
  try {
    const { meetingId, seriesTitle, moduleName, newContentUrl } = req.body;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      return res.status(400).json({ error: 'Invalid meetingId' });
    }
    if (!seriesTitle || !moduleName || !newContentUrl) {
      return res.status(400).json({ error: 'seriesTitle, moduleName, and newContentUrl are required' });
    }

    // Find the meeting
    const meeting = await Event.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    let usersUpdated = 0;
    const updatedEnrolledModules = meeting.enrolledModules.map(enrollment => {
      let updated = false;
      const updatedSeries = enrollment.enrolledSeries.map(series => {
        if (series.seriesTitle !== seriesTitle) {
          return series;
        }
        const updatedModules = series.modules.map(module => {
          if (module.name === moduleName && module.content !== newContentUrl) {
            updated = true;
            return { ...module, content: newContentUrl };
          }
          return module;
        });
        return { ...series, modules: updatedModules };
      });
      if (updated) {
        usersUpdated++;
      }
      return { ...enrollment, enrolledSeries: updatedSeries };
    });

    // Update the meeting document if any changes were made
    if (usersUpdated > 0) {
      meeting.enrolledModules = updatedEnrolledModules;
      await meeting.save();
    }

    res.json({
      message: `Processed ${meeting.enrolledModules.length} enrolled users. Updated Module 3 content for ${usersUpdated} users.`,
      meetingId,
      usersUpdated
    });
  } catch (err) {
    console.error('Error in updateEnrolledModuleContent:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.trackModuleProgress = async (req, res) => {
  try {
    const { userId, seriesTitle, moduleName, completed } = req.body;
    const { meetingId } = req.params;

    if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid meetingId or userId' });
    }

    if (completed === undefined || typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'Completed field must be a boolean' });
    }

    const meeting = await Event.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    let userEnrollment = meeting.enrolledModules.find(
      (em) => em.userId.toString() === userId
    );

    if (!userEnrollment) {
      return res.status(400).json({ error: 'User not enrolled in this meeting' });
    }

    const series = userEnrollment.enrolledSeries.find(
      (s) => s.seriesTitle === seriesTitle
    );

    if (!series) {
      return res.status(400).json({ error: 'Series not enrolled' });
    }

    const module = series.modules.find((m) => m.name === moduleName);
    if (!module) {
      return res.status(400).json({ error: 'Module not enrolled' });
    }

    module.watchProgress.completed = completed;
    module.watchProgress.completionDate = completed ? new Date() : null;

    // Define certificate templates
    const certificateTemplates = {
      'Soul Winning and Evangelism.': 'SoulWinning.pdf',
      'Performance Management & Reporting': 'Performance.pdf',
      'Media/Broadcast Production': 'MediaBroadcast_Production.pdf',
      'Journalism and Presenting': 'Journalism.pdf',
      'Financial Planning': 'Financial.pdf',
      'Writing': 'Financial.pdf',
      'Communication': 'Communication.pdf',
    };

    // Check if all enrolled modules in the series are completed
    const allModulesCompleted = series.modules.every(
      (m) => m.watchProgress.completed
    );

    if (allModulesCompleted && !series.certificate.certificateId) {
      series.certificate.certificateId = uuidv4();
      series.certificate.awardedAt = new Date();
      series.certificate.certificateTemplate = certificateTemplates[seriesTitle] || 'certificate.pdf';
      console.log(`Certificate awarded for ${seriesTitle}: ${series.certificate.certificateTemplate}`);
    } else if (!allModulesCompleted && series.certificate.certificateId) {
      series.certificate = {};
      console.log(`Certificate reset for ${seriesTitle}`);
    }

    await meeting.save();

    res.status(200).json({
      message: 'Module progress updated successfully',
      certificateId: series.certificate.certificateId,
    });
  } catch (error) {
    console.error('Error in trackModuleProgress:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

exports.downloadCertificate = async (req, res) => {
  try {
    const { meetingId, certificateId } = req.params;
    const { userId } = req.query;

    if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid meetingId or userId' });
    }

    const meeting = await Event.findById(meetingId).populate('enrolledModules.userId');
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const userEnrollment = meeting.enrolledModules.find(
      (em) => em.userId._id.toString() === userId
    );

    if (!userEnrollment) {
      return res.status(400).json({ error: 'User not enrolled in this meeting' });
    }

    const series = userEnrollment.enrolledSeries.find(
      (s) => s.certificate.certificateId === certificateId
    );

    if (!series || !series.certificate.certificateId) {
      return res.status(400).json({ error: 'Certificate not found or not awarded' });
    }

    // Load the certificate template
    const templatePath = `./templates/${series.certificate.certificateTemplate || 'certificate.pdf'}`;
    let templateBytes;
    try {
      templateBytes = await fs.readFile(templatePath);
      console.log(`Loaded template: ${templatePath}`);
    } catch (fileError) {
      console.error('Error reading template:', fileError);
      return res.status(500).json({ error: `Certificate template not found: ${templatePath}` });
    }

    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPage(0);
    const font = await pdfDoc.embedFont('Helvetica-Bold');

    const textColor = rgb(0, 0, 0);

    // Add text to the page
    const fullName = `${userEnrollment.userId.title || ''} ${userEnrollment.userId.firstName} ${userEnrollment.userId.lastName}`.trim();
    page.drawText(fullName, {
      x: 260,
      y: 220,
      size: 18,
      font,
      color: textColor,
    });

    // page.drawText(series.seriesTitle, {
    //   x: 100,
    //   y: 380,
    //   size: 16,
    //   font,
    //   color: textColor,
    // });

    // page.drawText(new Date(series.certificate.awardedAt).toLocaleDateString(), {
    //   x: 100,
    //   y: 350,
    //   size: 14,
    //   font,
    //   color: textColor,
    // });

    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=certificate-${certificateId}.pdf`
    );

    // Send the PDF
    res.end(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};


// // Get course series completion status for department staff
// exports.getDeptCourseSeriesCompletion = async (req, res) => {
//   try {
//     const { accessCode } = req.params;

//     if (!accessCode) {
//       return res.status(400).json({
//         success: false,
//         message: 'Access code is required'
//       });
//     }

//     // Verify access code
//     const deptAccess = await DeptAccess.findOne({ 
//       accessCode, 
//       isActive: true 
//     });

//     if (!deptAccess) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid or inactive access code'
//       });
//     }

//     const deptName = deptAccess.deptName;

//     // Get all staff in the department
//     const departmentStaff = await Lsdc.find({ deptName })
//       .select('_id title firstName lastName portalID deptName designation')
//       .lean();

//     if (!departmentStaff.length) {
//       return res.status(404).json({
//         success: true,
//         deptName,
//         deptCode: deptAccess.deptCode,
//         message: 'No staff found in this department',
//         staffCount: 0,
//         completionStatus: {}
//       });
//     }

//     const completionStatus = {};
    
//     // Get all meetings/events that have course series
//     const meetingsWithCourseSeries = await Event.find({
//       // isCourseSeries: true,
//       'courseSeries.0': { $exists: true } // Ensure there's at least one course series
//     });

//     // Check each meeting's course series for each staff member's completion status
//     for (const meeting of meetingsWithCourseSeries) {
//       try {
//         completionStatus[meeting._id] = {
//           meetingTitle: meeting.title,
//           meetingDescription: meeting.description,
//           meetingImage: meeting.image,
//           courseSeries: []
//         };

//         // For each course series in the meeting
//         for (const series of meeting.courseSeries) {
//           const seriesCompletion = {
//             seriesTitle: series.title,
//             seriesMinSelection: series.minSelection,
//             modules: [],
//             staffProgress: []
//           };

//           // For each module in the series
//           for (const module of series.modules) {
//             const moduleCompletion = {
//               moduleName: module.name,
//               moduleThumbnail: module.thumbnail,
//               moduleContent: module.content,
//               staffCompletion: []
//             };

//             // For each staff member in the department
//             for (const staff of departmentStaff) {
//               // Find if this staff member is enrolled in this meeting
//               const enrolledStaff = meeting.enrolledModules.find(
//                 enrolled => enrolled.userId.toString() === staff._id.toString()
//               );

//               if (enrolledStaff) {
//                 // Find if they're enrolled in this specific series
//                 const enrolledSeries = enrolledStaff.enrolledSeries.find(
//                   es => es.seriesTitle === series.title
//                 );

//                 if (enrolledSeries) {
//                   // Find if they're enrolled in this specific module
//                   const enrolledModule = enrolledSeries.modules.find(
//                     em => em.name === module.name
//                   );

//                   if (enrolledModule) {
//                     moduleCompletion.staffCompletion.push({
//                       staffId: staff._id,
//                       staffName: `${staff.title} ${staff.firstName} ${staff.lastName}`.trim(),
//                       staffPortalID: staff.portalID,
//                       staffDesignation: staff.designation,
//                       status: enrolledModule.watchProgress.completed ? 'COMPLETED' : 'PENDING',
//                       completed: enrolledModule.watchProgress.completed,
//                       completionDate: enrolledModule.watchProgress.completionDate,
//                       // Following the same pattern as your previous code
//                       contentId: module._id,
//                       title: module.name,
//                       description: module.content,
//                       image: module.thumbnail,
//                       media: { type: 'module', content: module.content },
//                       date: enrolledModule.watchProgress.completionDate
//                     });
//                   }
//                 }
//               }
//             }

//             seriesCompletion.modules.push(moduleCompletion);
//           }

//           // Calculate staff progress for the entire series
//           for (const staff of departmentStaff) {
//             const enrolledStaff = meeting.enrolledModules.find(
//               enrolled => enrolled.userId.toString() === staff._id.toString()
//             );

//             if (enrolledStaff) {
//               const enrolledSeries = enrolledStaff.enrolledSeries.find(
//                 es => es.seriesTitle === series.title
//               );

//               if (enrolledSeries) {
//                 const totalModules = enrolledSeries.modules.length;
//                 const completedModules = enrolledSeries.modules.filter(
//                   module => module.watchProgress.completed
//                 ).length;

//                 const completionRate = totalModules > 0 
//                   ? Math.round((completedModules / totalModules) * 100) 
//                   : 0;

//                 seriesCompletion.staffProgress.push({
//                   staffId: staff._id,
//                   staffName: `${staff.title} ${staff.firstName} ${staff.lastName}`.trim(),
//                   staffPortalID: staff.portalID,
//                   totalModules,
//                   completedModules,
//                   completionRate,
//                   status: completionRate === 100 ? 'COMPLETED' : 
//                           completionRate >= 50 ? 'IN_PROGRESS' : 'STARTED',
//                   certificate: enrolledSeries.certificate || null
//                 });
//               }
//             }
//           }

//           completionStatus[meeting._id].courseSeries.push(seriesCompletion);
//         }
//       } catch (error) {
//         console.error(`Error processing meeting ${meeting._id}:`, error);
//         completionStatus[meeting._id] = {
//           error: `Failed to retrieve data for meeting ${meeting.title}`
//         };
//       }
//     }

//     // Calculate overall department statistics
//     let totalStaffWithEnrollments = 0;
//     let totalCompletedModules = 0;
//     let totalModules = 0;

//     for (const staff of departmentStaff) {
//       let staffCompleted = 0;
//       let staffTotal = 0;

//       for (const meeting of meetingsWithCourseSeries) {
//         const enrolledStaff = meeting.enrolledModules.find(
//           enrolled => enrolled.userId.toString() === staff._id.toString()
//         );

//         if (enrolledStaff) {
//           totalStaffWithEnrollments++;
          
//           for (const enrolledSeries of enrolledStaff.enrolledSeries) {
//             staffTotal += enrolledSeries.modules.length;
//             staffCompleted += enrolledSeries.modules.filter(
//               module => module.watchProgress.completed
//             ).length;
//           }
//         }
//       }

//       totalCompletedModules += staffCompleted;
//       totalModules += staffTotal;
//     }

//     const overallCompletionRate = totalModules > 0 
//       ? Math.round((totalCompletedModules / totalModules) * 100) 
//       : 0;

//     const completionStats = {
//       totalStaff: departmentStaff.length,
//       totalStaffWithEnrollments,
//       totalMeetingsWithCourseSeries: meetingsWithCourseSeries.length,
//       totalModules,
//       totalCompletedModules,
//       totalPendingModules: totalModules - totalCompletedModules,
//       overallCompletionRate,
//       averageCompletionPerStaff: totalStaffWithEnrollments > 0 
//         ? Math.round(totalCompletedModules / totalStaffWithEnrollments) 
//         : 0
//     };

//     res.status(200).json({
//       success: true,
//       deptName,
//       deptCode: deptAccess.deptCode,
//       accessCode: deptAccess.accessCode,
//       staffCount: departmentStaff.length,
//       completionStats,
//       completionStatus
//     });

//   } catch (error) {
//     console.error('Error in getDeptCourseSeriesCompletion:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching department course series completion status'
//     });
//   }
// };

// Get course series completion status for department staff
// Get course series completion status for department staff
exports.getDeptCourseSeriesCompletion = async (req, res) => {
  try {
    const { accessCode } = req.params;

    if (!accessCode) {
      return res.status(400).json({
        success: false,
        message: 'Access code is required',
      });
    }

    // Validate and find department access
    const deptAccess = await DeptAccess.findOne({ accessCode, isActive: true });
    if (!deptAccess) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive access code',
      });
    }

    const deptName = deptAccess.deptName;

    // Get all staff in department
    const departmentStaff = await Lsdc.find({ deptName })
      .select('_id title firstName lastName portalID deptName designation')
      .lean();

    if (!departmentStaff.length) {
      return res.status(404).json({
        success: true,
        deptName,
        deptCode: deptAccess.deptCode,
        message: 'No staff found in this department',
        staffCount: 0,
        completionStatus: {},
      });
    }

    // Get all meetings that have enrolled modules
    const meetingsWithEnrollments = await Event.find({
      'enrolledModules.0': { $exists: true },
    });

    const completionStatus = {};

    // Department-level tracking variables
    let totalStaffWithEnrollments = 0;
    let totalCompletedModules = 0;
    let totalEnrolledModules = 0; // <-- changed from totalModules

    for (const meeting of meetingsWithEnrollments) {
      try {
        completionStatus[meeting._id] = {
          meetingTitle: meeting.title,
          meetingDescription: meeting.description,
          meetingImage: meeting.image,
          courseSeries: [],
        };

        // Loop through each series defined in meeting.courseSeries
        for (const courseSeries of meeting.courseSeries) {
          const seriesTitle = courseSeries.title;
          const seriesCompletion = {
            seriesTitle,
            staffProgress: [],
          };

          // For each staff in the department
          for (const staff of departmentStaff) {
            // Find their enrollment
            const enrolledStaff = meeting.enrolledModules.find(
              (e) => e.userId.toString() === staff._id.toString()
            );
            if (!enrolledStaff) continue;

            // Find their enrolled series
            const enrolledSeries = enrolledStaff.enrolledSeries.find(
              (s) => s.seriesTitle === seriesTitle
            );
            if (!enrolledSeries) continue;

            const totalModules = enrolledSeries.modules.length;
            const completedModules = enrolledSeries.modules.filter(
              (m) => m.watchProgress.completed
            ).length;

            // Count toward department totals
            totalStaffWithEnrollments++;
            totalEnrolledModules += totalModules;
            totalCompletedModules += completedModules;

            // Push staff progress
            seriesCompletion.staffProgress.push({
              staffId: staff._id,
              staffName: `${staff.title} ${staff.firstName} ${staff.lastName}`.trim(),
              staffPortalID: staff.portalID,
              designation: staff.designation,
              totalModules,
              completedModules,
              completionRate:
                totalModules > 0
                  ? Math.round((completedModules / totalModules) * 100)
                  : 0,
              status:
                completedModules === totalModules
                  ? 'COMPLETED'
                  : completedModules > 0
                  ? 'IN_PROGRESS'
                  : 'NOT_STARTED',
              certificate: enrolledSeries.certificate || null,
            });
          }

          completionStatus[meeting._id].courseSeries.push(seriesCompletion);
        }
      } catch (err) {
        console.error(`Error processing meeting ${meeting._id}:`, err);
        completionStatus[meeting._id] = {
          error: `Failed to retrieve data for meeting ${meeting.title}`,
        };
      }
    }

    // Final stats
    const overallCompletionRate =
      totalEnrolledModules > 0
        ? Math.round((totalCompletedModules / totalEnrolledModules) * 100)
        : 0;

    const completionStats = {
      totalStaff: departmentStaff.length,
      totalStaffWithEnrollments,
      totalMeetingsWithEnrollments: meetingsWithEnrollments.length,
      totalEnrolledModules,
      totalCompletedModules,
      totalPendingModules: totalEnrolledModules - totalCompletedModules,
      overallCompletionRate,
      averageCompletionPerStaff:
        totalStaffWithEnrollments > 0
          ? Math.round(totalCompletedModules / totalStaffWithEnrollments)
          : 0,
    };

    res.status(200).json({
      success: true,
      deptName,
      deptCode: deptAccess.deptCode,
      accessCode: deptAccess.accessCode,
      staffCount: departmentStaff.length,
      completionStats,
      completionStatus,
    });
  } catch (error) {
    console.error('Error in getDeptCourseSeriesCompletion:', error);
    res.status(500).json({
      success: false,
      message:
        'Server error while fetching department course series completion status',
      details: error.message,
    });
  }
};


// exports.trackModuleProgress = async (req, res) => {
//   try {
//     const { meetingId } = req.params;
//     const { userId: queryUserId, seriesTitle, moduleName } = req.method === 'GET' ? req.query : req.body;
//     const { userId: bodyUserId, completed } = req.body || {};

//     if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(queryUserId || bodyUserId)) {
//       return res.status(400).json({ error: 'Invalid meetingId or userId' });
//     }

//     const meeting = await Event.findById(meetingId);
//     if (!meeting) {
//       return res.status(404).json({ error: 'Meeting not found' });
//     }

//     let userEnrollment = meeting.enrolledModules.find(
//       (em) => em.userId.toString() === (queryUserId || bodyUserId)
//     );

//     if (!userEnrollment) {
//       return res.status(400).json({ error: 'User not enrolled in this meeting' });
//     }

//     const series = userEnrollment.enrolledSeries.find(
//       (s) => s.seriesTitle === seriesTitle
//     );

//     if (!series) {
//       return res.status(400).json({ error: 'Series not enrolled' });
//     }

//     const module = series.modules.find((m) => m.name === moduleName);
//     if (!module) {
//       return res.status(400).json({ error: 'Module not enrolled' });
//     }

//     if (req.method === 'GET') {
//       // Return watchProgress for the module
//       return res.status(200).json({
//         watchProgress: module.watchProgress || { activeWatchDuration: 0, completed: false },
//       });
//     }

//     if (req.method === 'POST') {
//       if (completed === undefined || typeof completed !== 'boolean') {
//         return res.status(400).json({ error: 'Completed field must be a boolean' });
//       }

//       module.watchProgress.completed = completed;
//       module.watchProgress.completionDate = completed ? new Date() : null;

//       // Define certificate templates
//       const certificateTemplates = {
//         'Leadership Series': 'leadership_series.pdf',
//         'Technical Training': 'technical_training.pdf',
//         'Professional Development': 'professional_development.pdf',
//       };

//       // Check if all enrolled modules in the series are completed
//       const allModulesCompleted = series.modules.every(
//         (m) => m.watchProgress.completed
//       );

//       if (allModulesCompleted && !series.certificate.certificateId) {
//         series.certificate.certificateId = uuidv4();
//         series.certificate.awardedAt = new Date();
//         series.certificate.certificateTemplate =
//           certificateTemplates[seriesTitle] || 'default_certificate.pdf';
//         console.log(`Certificate awarded for ${seriesTitle}: ${series.certificate.certificateTemplate}`);
//       } else if (!allModulesCompleted && series.certificate.certificateId) {
//         series.certificate = {};
//         console.log(`Certificate reset for ${seriesTitle}`);
//       }

//       await meeting.save();

//       return res.status(200).json({
//         message: 'Module progress updated successfully',
//         certificateId: series.certificate.certificateId,
//       });
//     }

//     return res.status(405).json({ error: 'Method not allowed' });
//   } catch (error) {
//     console.error('Error in trackModuleProgress:', error);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// };
// exports.trackModuleProgress = async (req, res) => {
//   try {
//     const { userId, seriesTitle, moduleName, completed } = req.body;
//     const { meetingId } = req.params;

//     if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(userId)) {
//       return res.status(400).json({ error: 'Invalid meetingId or userId' });
//     }

//     if (completed === undefined || typeof completed !== 'boolean') {
//       return res.status(400).json({ error: 'Completed field must be a boolean' });
//     }

//     const meeting = await Event.findById(meetingId);
//     if (!meeting) {
//       return res.status(404).json({ error: 'Meeting not found' });
//     }

//     let userEnrollment = meeting.enrolledModules.find(
//       (em) => em.userId.toString() === userId
//     );

//     if (!userEnrollment) {
//       return res.status(400).json({ error: 'User not enrolled in this meeting' });
//     }

//     const series = userEnrollment.enrolledSeries.find(
//       (s) => s.seriesTitle === seriesTitle
//     );

//     if (!series) {
//       return res.status(400).json({ error: 'Series not enrolled' });
//     }

//     const module = series.modules.find((m) => m.name === moduleName);
//     if (!module) {
//       return res.status(400).json({ error: 'Module not enrolled' });
//     }

//     module.watchProgress.completed = completed;
//     module.watchProgress.completionDate = completed ? new Date() : null;

//     // Check if all enrolled modules in the series are completed
//     const allModulesCompleted = series.modules.every(
//       (m) => m.watchProgress.completed
//     );

//     if (allModulesCompleted && !series.certificate.certificateId) {
//       series.certificate.certificateId = uuidv4();
//       series.certificate.awardedAt = new Date();
//     } else if (!allModulesCompleted && series.certificate.certificateId) {
//       series.certificate = {}; // Reset certificate if not all modules are completed
//     }

//     await meeting.save();

//     res.status(200).json({
//       message: 'Module progress updated successfully',
//       certificateId: series.certificate.certificateId,
//     });
//   } catch (error) {
//     console.error('Error in trackModuleProgress:', error);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// };


// exports.downloadCertificate = async (req, res) => {
//   try {
//     const { meetingId, certificateId } = req.params;
//     const { userId } = req.query;

//     if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(userId)) {
//       return res.status(400).json({ error: 'Invalid meetingId or userId' });
//     }

//     const meeting = await Event.findById(meetingId).populate('enrolledModules.userId');
//     if (!meeting) {
//       return res.status(404).json({ error: 'Meeting not found' });
//     }

//     const userEnrollment = meeting.enrolledModules.find(
//       (em) => em.userId._id.toString() === userId
//     );

//     if (!userEnrollment) {
//       return res.status(400).json({ error: 'User not enrolled in this meeting' });
//     }

//     const series = userEnrollment.enrolledSeries.find(
//       (s) => s.certificate.certificateId === certificateId
//     );

//     if (!series || !series.certificate.certificateId) {
//       return res.status(400).json({ error: 'Certificate not found or not awarded' });
//     }

//     // Load the pre-designed PDF template
//     const templatePath = './templates/certificate.pdf';
//     let templateBytes;
//     try {
//       templateBytes = await fs.readFile(templatePath);
//     } catch (fileError) {
//       console.error('Error reading template:', fileError);
//       return res.status(500).json({ error: 'Certificate template not found' });
//     }

//     const pdfDoc = await PDFDocument.load(templateBytes);
//     const page = pdfDoc.getPage(0);
//     const font = await pdfDoc.embedFont('Helvetica-Bold');

//     // Use rgb function from pdf-lib
//     const textColor = rgb(0, 0, 0); // Black

//     // Add text to the page
//     const fullName = `${userEnrollment.userId.title} ${userEnrollment.userId.firstName} ${userEnrollment.userId.lastName}`;
//     page.drawText(fullName, {
//       x: 100, // Adjust based on template
//       y: 410,
//       size: 18,
      
//       font,
//       color: textColor,
//     });

//     // Serialize the PDF
//     const pdfBytes = await pdfDoc.save();

//     // Set response headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename=certificate-${certificateId}.pdf`
//     );

//     // Send the PDF
//     res.end(Buffer.from(pdfBytes));
//   } catch (error) {
//     console.error('Error generating certificate:', error);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// };




















// // In eventController.js
// exports.downloadCertificate = async (req, res) => {
//   try {
//     const { meetingId, certificateId } = req.params;
//     const { userId } = req.query;

//     if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(userId)) {
//       return res.status(400).json({ error: 'Invalid meetingId or userId' });
//     }

//     const meeting = await Event.findById(meetingId).populate('enrolledModules.userId');
//     if (!meeting) {
//       return res.status(404).json({ error: 'Meeting not found' });
//     }

//     const userEnrollment = meeting.enrolledModules.find(
//       (em) => em.userId._id.toString() === userId
//     );

//     if (!userEnrollment) {
//       return res.status(400).json({ error: 'User not enrolled in this meeting' });
//     }

//     const series = userEnrollment.enrolledSeries.find(
//       (s) => s.certificate.certificateId === certificateId
//     );

//     if (!series || !series.certificate.certificateId) {
//       return res.status(400).json({ error: 'Certificate not found or not awarded' });
//     }

//     const doc = new PDFDocument({
//       size: 'A4',
//       layout: 'landscape',
//       margin: 50,
//     });

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename=certificate-${certificateId}.pdf`
//     );

//     doc.pipe(res);

//     const fullName = `${userEnrollment.userId.firstName} ${userEnrollment.userId.lastName}`;
//     doc.fontSize(36).text('Certificate of Completion', { align: 'center' });
//     doc.moveDown(2);
//     doc.fontSize(24).text(`Awarded to: ${fullName}`, { align: 'center' });
//     doc.moveDown(1);
//     doc.fontSize(20).text(`For completing the course series: ${series.seriesTitle}`, { align: 'center' });
//     doc.moveDown(1);
//     doc.fontSize(16).text(`Awarded on: ${series.certificate.awardedAt.toDateString()}`, { align: 'center' });
//     doc.moveDown(2);
//     doc.fontSize(14).text(`Meeting: ${meeting.title}`, { align: 'center' });

//     doc.end();
//   } catch (error) {
//     console.error('Error generating certificate:', error);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// };
// exports.downloadCertificate = async (req, res) => {
//   try {
//     const { meetingId, certificateId } = req.params;
//     const { userId } = req.query;

//     if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(userId)) {
//       return res.status(400).json({ error: 'Invalid meetingId or userId' });
//     }

//     const meeting = await Event.findById(meetingId);
//     if (!meeting) {
//       return res.status(404).json({ error: 'Meeting not found' });
//     }

//     const userEnrollment = meeting.enrolledModules.find(
//       (em) => em.userId.toString() === userId
//     );

//     if (!userEnrollment) {
//       return res.status(400).json({ error: 'User not enrolled in this meeting' });
//     }

//     const series = userEnrollment.enrolledSeries.find(
//       (s) => s.certificate.certificateId === certificateId
//     );

//     if (!series || !series.certificate.certificateId) {
//       return res.status(400).json({ error: 'Certificate not found or not awarded' });
//     }

//     // Generate PDF
//     const doc = new PDFDocument({
//       size: 'A4',
//       layout: 'landscape',
//       margin: 50,
//     });

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader(
//       'Content-Disposition',
//       `attachment; filename=certificate-${certificateId}.pdf`
//     );

//     doc.pipe(res);

//     // Add content to PDF
//     doc.fontSize(36).text('Certificate of Completion', { align: 'center' });
//     doc.moveDown(2);
//     doc.fontSize(24).text(`Awarded to: ${userEnrollment.userId.name}`, { align: 'center' });
//     doc.moveDown(1);
//     doc.fontSize(20).text(`For completing the course series: ${series.seriesTitle}`, { align: 'center' });
//     doc.moveDown(1);
//     doc.fontSize(16).text(`Awarded on: ${series.certificate.awardedAt.toDateString()}`, { align: 'center' });
//     doc.moveDown(2);
//     doc.fontSize(14).text(`Meeting: ${meeting.title}`, { align: 'center' });

//     doc.end();
//   } catch (error) {
//     console.error('Error generating certificate:', error);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// };



// exports.addModuleComment = async (req, res) => {
//   try {
//     const { userId, seriesTitle, moduleName, name, text } = req.body;
//     const { meetingId } = req.params;

//     if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(userId)) {
//       return res.status(400).json({ error: 'Invalid meetingId or userId' });
//     }

//     if (!name || !text) {
//       return res.status(400).json({ error: 'Name and comment text are required' });
//     }

//     const meeting = await Event.findById(meetingId);
//     if (!meeting) {
//       return res.status(404).json({ error: 'Meeting not found' });
//     }

//     let userEnrollment = meeting.enrolledModules.find(
//       (em) => em.userId.toString() === userId
//     );

//     if (!userEnrollment) {
//       return res.status(400).json({ error: 'User not enrolled in this meeting' });
//     }

//     const series = userEnrollment.enrolledSeries.find(
//       (s) => s.seriesTitle === seriesTitle
//     );

//     if (!series) {
//       return res.status(400).json({ error: 'Series not enrolled' });
//     }

//     const module = series.modules.find((m) => m.name === moduleName);
//     if (!module) {
//       return res.status(400).json({ error: 'Module not enrolled' });
//     }

//     module.comments.push({ userId, name, text });
//     await meeting.save();

//     res.status(200).json({ message: 'Comment added successfully' });
//   } catch (error) {
//     console.error('Error adding comment:', error);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// };

exports.addModuleComment = async (req, res) => {
  try {
    const { userId, seriesTitle, moduleName, name, text, picture, deptName } = req.body;
    const { meetingId } = req.params;

    if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid meetingId or userId' });
    }

    if (!name || !text) {
      return res.status(400).json({ error: 'Name and comment text are required' });
    }

    const meeting = await Event.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    let userEnrollment = meeting.enrolledModules.find(
      (em) => em.userId.toString() === userId
    );

    if (!userEnrollment) {
      return res.status(400).json({ error: 'User not enrolled in this meeting' });
    }

    const series = userEnrollment.enrolledSeries.find(
      (s) => s.seriesTitle === seriesTitle
    );

    if (!series) {
      return res.status(400).json({ error: 'Series not enrolled' });
    }

    const module = series.modules.find((m) => m.name === moduleName);
    if (!module) {
      return res.status(400).json({ error: 'Module not enrolled' });
    }

    module.comments.push({ userId, name, text, picture, deptName });
    await meeting.save();

    res.status(200).json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

exports.deleteModuleComment = async (req, res) => {
  try {
    const { commentId, userId, seriesTitle, moduleName } = req.body;
    const { meetingId } = req.params;

    if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ error: 'Invalid meetingId, userId, or commentId' });
    }

    const meeting = await Event.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    let userEnrollment = meeting.enrolledModules.find(
      (em) => em.userId.toString() === userId
    );

    if (!userEnrollment) {
      return res.status(400).json({ error: 'User not enrolled in this meeting' });
    }

    const series = userEnrollment.enrolledSeries.find(
      (s) => s.seriesTitle === seriesTitle
    );

    if (!series) {
      return res.status(400).json({ error: 'Series not enrolled' });
    }

    const module = series.modules.find((m) => m.name === moduleName);
    if (!module) {
      return res.status(400).json({ error: 'Module not enrolled' });
    }

    const commentIndex = module.comments.findIndex(
      (c) => c._id.toString() === commentId && c.userId.toString() === userId
    );

    if (commentIndex === -1) {
      return res.status(403).json({ error: 'Comment not found or not authorized to delete' });
    }

    module.comments.splice(commentIndex, 1);
    await meeting.save();

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

exports.getModuleCommentsAndLikes = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { seriesTitle, moduleName } = req.query;

    if (!mongoose.isValidObjectId(meetingId)) {
      return res.status(400).json({ error: 'Invalid meetingId' });
    }

    const meeting = await Event.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    let allComments = [];
    let allLikes = [];

    // Loop through all enrolledModules (users)
    for (const enrollment of meeting.enrolledModules) {
      const series = enrollment.enrolledSeries.find(
        (s) => s.seriesTitle === seriesTitle
      );

      if (!series) continue;

      const module = series.modules.find((m) => m.name === moduleName);
      if (!module) continue;

      if (module.comments && module.comments.length > 0) {
        allComments.push(...module.comments);
      }

      if (module.likes && module.likes.length > 0) {
        allLikes.push(...module.likes);
      }
    }

    res.status(200).json({
      comments: allComments,
      likeCount: allLikes.length,
      likedUserIds: allLikes.map((like) => like.userId),
    });
  } catch (error) {
    console.error('Error fetching comments and likes:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};



exports.toggleModuleLike = async (req, res) => {
  try {
    const { userId, seriesTitle, moduleName } = req.body;
    const { meetingId } = req.params;

    if (!mongoose.isValidObjectId(meetingId) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid meetingId or userId' });
    }

    const meeting = await Event.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    let userEnrollment = meeting.enrolledModules.find(
      (em) => em.userId.toString() === userId
    );

    if (!userEnrollment) {
      return res.status(400).json({ error: 'User not enrolled in this meeting' });
    }

    const series = userEnrollment.enrolledSeries.find(
      (s) => s.seriesTitle === seriesTitle
    );

    if (!series) {
      return res.status(400).json({ error: 'Series not enrolled' });
    }

    const module = series.modules.find((m) => m.name === moduleName);
    if (!module) {
      return res.status(400).json({ error: 'Module not enrolled' });
    }

    const existingLike = module.likes.find(
      (like) => like.userId.toString() === userId
    );

    if (existingLike) {
      module.likes = module.likes.filter(
        (like) => like.userId.toString() !== userId
      );
    } else {
      module.likes.push({ userId });
    }

    await meeting.save();

    res.status(200).json({
      message: existingLike ? 'Like removed' : 'Like added',
      likeCount: module.likes.length,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};


exports.postEvent = async (req, res) => {
  const { title, description,courseSeries, image,deptName,faculties, gender, designation, portalIds,kc,kingsPass,info, forAllUsers,media, maritalStatus, rankName,videoUrl,jobFamilyName, requireParticipationMode} = req.body;

  try {
  const portalIdArray = portalIds
  ? Array.isArray(portalIds)
    ? portalIds
    : [portalIds]
  : [];

const kcArray = kc
  ? Array.isArray(kc)
    ? kc
    : [kc]
  : [];
    const newEvent = new Event({
      title,
      description,
      image,
      deptName,
      media,
      info,
      gender,
      maritalStatus,
      designation,
      portalIds: portalIdArray,
      forAllUsers,
      rankName,
      videoUrl,
      faculties: Array.isArray(faculties) && faculties.length > 0 
  ? faculties 
  : ["ALL"],
      kc:kcArray,
      kingsPass,
      requireParticipationMode,
      jobFamilyName,
      courseSeries: Array.isArray(courseSeries) ? courseSeries : [], // Optional inclusion
      acceptedBy: [] // initialize with an empty array
    });

    await newEvent.save();
    res.status(201).json({ message: 'Event posted successfully', event: newEvent });
  } catch (error) {
    console.error('Error posting event:', error); // Log error details
    res.status(400).json({ error: 'Error posting event', details: error.message });
  }
};

// UPDATE an event (partial update)
exports.updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const updateData = req.body; // Data to update

  try {
    // Find the event by ID and update only the provided fields
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $set: updateData }, // Only update fields that are provided
      { new: true, runValidators: true } // Return the updated event
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event updated successfully", event: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(400).json({ error: "Error updating event", details: error.message });
  }
};




// exports.acceptEvent = async (req, res) => {
//   const { userId, eventId, participationMode, name, picture, department, jobFamilyName } = req.body;

//   try {
//     console.log("Incoming Data:", { userId, eventId, participationMode, name, picture, department, jobFamilyName });

//     // Fetch the event
//     const event = await Event.findById(eventId);
//     if (!event) {
//       return res.status(404).json({ error: "Event not found" });
//     }

//     // Validate required fields for all events
//     if (!name || !picture || !department) {
//       return res.status(400).json({ error: "Name, picture, department, and jobFamilyName are required" });
//     }

//     // Validate `participationMode` if `requireParticipationMode` is true
//     if (event.requireParticipationMode) {
//       if (!participationMode) {
//         return res.status(400).json({ error: "Participation mode is required for this event" });
//       }
//       if (!["Online", "Onsite"].includes(participationMode)) {
//         return res.status(400).json({ error: "Invalid participation mode" });
//       }
//     }

//     // Check if user already accepted
//     const alreadyAccepted = event.acceptedBy.some((entry) => entry.userId?.toString() === userId);
//     if (alreadyAccepted) {
//       return res.status(400).json({ error: "User already accepted this event" });
//     }

//     // Construct user details object
//     const userDetails = {
//       userId,
//       participationMode: event.requireParticipationMode ? participationMode : null,
//       name,
//       picture,
//       department,
//       jobFamilyName,
//     };

//     console.log("Constructed UserDetails:", userDetails);

//     // Push user details and save event
//     event.acceptedBy.push(userDetails);
//     await event.save();

//     // Optional: Update related programs
//     await Programs.updateMany(
//       {
//         $or: [
//           { portalId: { $in: event.portalIds } },
//           {
//             deptName: event.deptName,
//             rankName: event.rankName,
//             gender: event.gender,
//             designation: event.designation,
//             maritalStatus: event.maritalStatus,
//           },
//         ],
//       },
//       { $addToSet: { acceptedBy: userId } }
//     );

//     res.status(200).json({ message: "Event accepted successfully", event });
//   } catch (error) {
//     console.error("Error accepting event:", error);
//     res.status(500).json({ error: "Error accepting event", details: error.message });
//   }
// };

exports.acceptEvent = async (req, res) => {
  const {
    userId,
    eventId,
    participationMode,
    name,
    picture,
    department,
    jobFamilyName,
    faculties, // ✅ NEW
  } = req.body;

  try {
    console.log("Incoming Data:", {
      userId,
      eventId,
      participationMode,
      name,
      picture,
      department,
      jobFamilyName,
      faculties,
    });

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!name || !picture || !department) {
      return res.status(400).json({
        error: "Name, picture and department are required",
      });
    }

    if (event.requireParticipationMode) {
      if (!participationMode) {
        return res.status(400).json({
          error: "Participation mode is required for this event",
        });
      }
      if (!["Online", "Onsite"].includes(participationMode)) {
        return res.status(400).json({
          error: "Invalid participation mode",
        });
      }
    }

    // ✅ Prevent duplicate acceptance
    const alreadyAccepted = event.acceptedBy.some(
      (entry) => entry.userId?.toString() === userId
    );

    if (alreadyAccepted) {
      return res.status(400).json({
        error: "User already accepted this event",
      });
    }

    // ✅ ADD faculties HERE
    const userDetails = {
      userId,
      participationMode: event.requireParticipationMode
        ? participationMode
        : null,
      name,
      picture,
      department,
      jobFamilyName,
      faculties: faculties || "Not Assigned", // ✅ SAFE DEFAULT
    };

    console.log("Constructed UserDetails:", userDetails);

    event.acceptedBy.push(userDetails);
    await event.save();

    await Programs.updateMany(
      {
        $or: [
          { portalId: { $in: event.portalIds } },
          {
            deptName: event.deptName,
            rankName: event.rankName,
            gender: event.gender,
            designation: event.designation,
            maritalStatus: event.maritalStatus,
          },
        ],
      },
      { $addToSet: { acceptedBy: userId } }
    );

    res.status(200).json({
      message: "Event accepted successfully",
      event,
    });
  } catch (error) {
    console.error("Error accepting event:", error);
    res.status(500).json({
      error: "Error accepting event",
      details: error.message,
    });
  }
};

// exports.enrollInModules = async (req, res) => {
//   const { eventId, userId, enrolledSeries } = req.body;

//   try {
//     const event = await Event.findById(eventId);
//     if (!event) return res.status(404).json({ error: 'Event not found' });

//     if (!Array.isArray(enrolledSeries) || enrolledSeries.length === 0) {
//       return res.status(400).json({ error: 'No series/modules selected for enrollment' });
//     }

//     // Check if user already enrolled
//     const alreadyEnrolled = event.enrolledModules.some(entry => entry.userId.toString() === userId);
//     if (alreadyEnrolled) {
//       return res.status(400).json({ error: 'User already enrolled in modules for this event' });
//     }

//     // Prepare enriched enrolledSeries with module details
//     const enrichedEnrolledSeries = [];

//     // Validate minSelection and enrich module data
//     for (const selectedSeries of enrolledSeries) {
//       const { seriesTitle, moduleNames } = selectedSeries;

//       const eventSeries = event.courseSeries.find(cs => cs.title === seriesTitle);
//       if (!eventSeries) {
//         return res.status(400).json({ error: `Series "${seriesTitle}" not found in event` });
//       }

//       if ((moduleNames?.length || 0) < (eventSeries.minSelection || 0)) {
//         return res.status(400).json({
//           error: `At least ${eventSeries.minSelection} modules must be selected for "${seriesTitle}"`,
//         });
//       }

//       // Validate and enrich modules
//       const enrichedModules = [];
//       for (const moduleName of moduleNames) {
//         const module = eventSeries.modules.find(m => m.name === moduleName);
//         if (!module) {
//           return res.status(400).json({ error: `Module "${moduleName}" not found in series "${seriesTitle}"` });
//         }
//         enrichedModules.push({
//           name: module.name,
//           thumbnail: module.thumbnail || '',
//           content: module.content || '',
//         });
//       }
                                                      
//       enrichedEnrolledSeries.push({
//         seriesTitle,
//         modules: enrichedModules,
//       });
//     }

//     // Push enrollment
//     event.enrolledModules.push({
//       userId,
//       enrolledSeries: enrichedEnrolledSeries,
//     });

//     await event.save();
//     res.status(200).json({ message: 'Enrollment successful', event });
//   } catch (error) {
//     console.error('Error enrolling in modules:', error);
//     res.status(500).json({ error: 'Internal Server Error', details: error.message });
//   }
// };
exports.enrollInModules = async (req, res) => {
  const { eventId, userId, enrolledSeries } = req.body;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (!Array.isArray(enrolledSeries) || enrolledSeries.length === 0) {
      return res.status(400).json({ error: 'No series/modules selected for enrollment' });
    }

    // Check if user is already enrolled
    const userEnrollment = event.enrolledModules.find(
      (entry) => entry.userId.toString() === userId
    );

    if (userEnrollment) {
      // User is already enrolled, use addModulesToUserEnrollment logic
      for (const selectedSeries of enrolledSeries) {
        const { seriesTitle, moduleNames } = selectedSeries;

        const eventSeries = event.courseSeries.find((cs) => cs.title === seriesTitle);
        if (!eventSeries) {
          return res.status(400).json({ error: `Series "${seriesTitle}" not found in event` });
        }

        // Validate minSelection (consider existing modules)
        const existingModules = userEnrollment.enrolledSeries
          .find((s) => s.seriesTitle === seriesTitle)
          ?.modules.map((m) => m.name) || [];
        const totalSelectedModules = [
          ...new Set([...existingModules, ...(moduleNames || [])]),
        ];
        if (totalSelectedModules.length < (eventSeries.minSelection || 0)) {
          return res.status(400).json({
            error: `At least ${eventSeries.minSelection} modules must be selected for "${seriesTitle}"`,
          });
        }

        // Filter out already enrolled modules
        const newModuleNames = moduleNames.filter(
          (name) => !existingModules.includes(name)
        );
        if (newModuleNames.length === 0) {
          continue; // No new modules to add for this series
        }

        // Enrich new modules
        const newModules = newModuleNames
          .map((name) => {
            const module = eventSeries.modules.find((m) => m.name === name);
            if (!module) return null;
            return {
              name: module.name,
              thumbnail: module.thumbnail || '',
              content: module.content || '',
              watchProgress: { completed: false },
              comments: [],
              likes: [],
            };
          })
          .filter(Boolean);

        if (newModules.length === 0) {
          return res.status(400).json({
            error: `Invalid modules in "${seriesTitle}"`,
          });
        }

        // Add to existing series or create new
        let enrolledSeries = userEnrollment.enrolledSeries.find(
          (s) => s.seriesTitle === seriesTitle
        );
        if (!enrolledSeries) {
          enrolledSeries = { seriesTitle, modules: [], certificate: {} };
          userEnrollment.enrolledSeries.push(enrolledSeries);
        }
        enrolledSeries.modules.push(...newModules);
      }

      await event.save();
      return res.status(200).json({ message: 'Modules added successfully', event });
    }

    // New enrollment
    const enrichedEnrolledSeries = [];
    for (const selectedSeries of enrolledSeries) {
      const { seriesTitle, moduleNames } = selectedSeries;

      const eventSeries = event.courseSeries.find((cs) => cs.title === seriesTitle);
      if (!eventSeries) {
        return res.status(400).json({ error: `Series "${seriesTitle}" not found in event` });
      }

      if ((moduleNames?.length || 0) < (eventSeries.minSelection || 0)) {
        return res.status(400).json({
          error: `At least ${eventSeries.minSelection} modules must be selected for "${seriesTitle}"`,
        });
      }

      const enrichedModules = [];
      for (const moduleName of moduleNames) {
        const module = eventSeries.modules.find((m) => m.name === moduleName);
        if (!module) {
          return res.status(400).json({
            error: `Module "${moduleName}" not found in series "${seriesTitle}"`,
          });
        }
        enrichedModules.push({
          name: module.name,
          thumbnail: module.thumbnail || '',
          content: module.content || '',
          watchProgress: { completed: false },
          comments: [],
          likes: [],
        });
      }

      enrichedEnrolledSeries.push({
        seriesTitle,
        modules: enrichedModules,
        certificate: {},
      });
    }

    event.enrolledModules.push({
      userId,
      enrolledSeries: enrichedEnrolledSeries,
      createdAt: new Date(),
    });

    await event.save();
    res.status(200).json({ message: 'Enrollment successful', event });
  } catch (error) {
    console.error('Error enrolling in modules:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
exports.getEvents = async (req, res) => {
  const { portalIds, deptName, gender, designation, maritalStatus, rankName, kc, faculties } = req.query;

  try {
    const filter = {
      $or: [
        { forAllUsers: true },

        {
          portalIds: {
            $in: Array.isArray(portalIds)
              ? portalIds.map(String)
              : portalIds
              ? [String(portalIds)]
              : [],
          },
        },

        {
          kc: {
            $in: Array.isArray(kc)
              ? kc.map(String)
              : kc
              ? [String(kc)]
              : [],
          },
        },

        { deptName },
        { gender },
        { designation },
        { maritalStatus },
        { rankName },

        // ✅ FIXED FACULTY FILTER
        {
          faculties: {
            $in: Array.isArray(faculties)
              ? faculties
              : faculties
              ? [faculties]
              : [],
          },
        },
      ],
    };

    const events = await Event.find(filter).sort({ createdAt: -1 });

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(400).json({ error: "Error fetching events" });
  }
};


exports.enrollInModules = async (req, res) => {
  const { eventId, userId, enrolledSeries } = req.body;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (!Array.isArray(enrolledSeries) || enrolledSeries.length === 0) {
      return res.status(400).json({ error: 'No series/modules selected for enrollment' });
    }

    // Check if user already enrolled
    const alreadyEnrolled = event.enrolledModules.some(entry => entry.userId.toString() === userId);
    if (alreadyEnrolled) {
      return res.status(400).json({ error: 'User already enrolled in modules for this event' });
    }

    // Prepare enriched enrolledSeries with module details
    const enrichedEnrolledSeries = [];

    // Validate minSelection and enrich module data
    for (const selectedSeries of enrolledSeries) {
      const { seriesTitle, moduleNames } = selectedSeries;

      const eventSeries = event.courseSeries.find(cs => cs.title === seriesTitle);
      if (!eventSeries) {
        return res.status(400).json({ error: `Series "${seriesTitle}" not found in event` });
      }

      if ((moduleNames?.length || 0) < (eventSeries.minSelection || 0)) {
        return res.status(400).json({
          error: `At least ${eventSeries.minSelection} modules must be selected for "${seriesTitle}"`,
        });
      }

      // Validate and enrich modules
      const enrichedModules = [];
      for (const moduleName of moduleNames) {
        const module = eventSeries.modules.find(m => m.name === moduleName);
        if (!module) {
          return res.status(400).json({ error: `Module "${moduleName}" not found in series "${seriesTitle}"` });
        }
        enrichedModules.push({
          name: module.name,
          thumbnail: module.thumbnail || '',
          content: module.content || '',
        });
      }
                                                      
      enrichedEnrolledSeries.push({
        seriesTitle,
        modules: enrichedModules,
      });
    }

    // Push enrollment
    event.enrolledModules.push({
      userId,
      enrolledSeries: enrichedEnrolledSeries,
    });

    await event.save();
    res.status(200).json({ message: 'Enrollment successful', event });
  } catch (error) {
    console.error('Error enrolling in modules:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};


  
exports.deleteEvent = async (req, res) => {
    const { eventId } = req.params;

    try {
        await Event.findByIdAndDelete(eventId);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Error deleting event' });
    }
};


// exports.getEvents = async (req, res) => {
//   const { portalIds, deptName, gender, designation, maritalStatus, rankName } = req.query;

//   try {
//     const filter = {
//       $and: [ // Use $and to combine conditions
//         {
//           $or: [
//             { forAllUsers: true }, // Event for all users
//             { portalIds: { $in: Array.isArray(portalIds) ? portalIds.map(String) : [String(portalIds)] } },
//             { deptName: deptName }, // Event for a specific department
//             { gender: gender }, // Event based on gender
//             { designation: designation }, // Event based on designation
//             { maritalStatus: maritalStatus },
//             { rankName: rankName },
//           ],
//         },
//         { expiredDate: false }, // Only include events where expiredDate is false
//       ],
//     };

//     const events = await Event.find(filter);
//     res.status(200).json(events);
//   } catch (error) {
//     console.error("Error fetching events:", error); // Log error details
//     res.status(400).json({ error: "Error fetching events" });
//   }
// };



// exports.getEvents = async (req, res) => {
//     const { portalIds, deptName, gender, designation,maritalStatus,rankName } = req.query;
  
//     try {
//       let filter = {
//         $or: [
//           { forAllUsers: true }, // Event for all users
//           { portalIds: portalIds }, // Event for specific portalID
//           { deptName: deptName }, // Event for a specific department
//           { gender: gender }, // Event based on gender
//           { designation: designation },// Event based on designation
//           { maritalStatus: maritalStatus },
//           {rankName:rankName}
//         ]
//       };
  
//       const events = await Event.find(filter);
//       res.status(200).json(events);
//     } catch (error) {
//       res.status(400).json({ error: 'Error fetching events' });
//     }
//   };

// Accept an event for an individual user
// exports.acceptEvent = async (req, res) => {
//   const { userId, eventId } = req.body;

//   try {
//       const event = await Event.findById(eventId);
//       if (!event) return res.status(404).json({ error: 'Event not found' });

//       // Only add userId if they haven't accepted yet
//       if (!event.acceptedBy.includes(userId)) {
//           event.acceptedBy.push(userId); // Add the user to the accepted list
//           await event.save();
//       }

//       // Update Programs content to reflect individual acceptance
//       await Programs.updateMany(
//           { portalId: event.portalId,rankName:event.rankName, deptName: event.deptName, gender: event.gender, designation: event.designation, maritalStatus: event.maritalStatus },
//           { $addToSet: { acceptedBy: userId } }
//       );

//       res.status(200).json({ message: 'Event accepted by user', event });
//   } catch (error) {
//       res.status(400).json({ error: 'Error accepting event' });
//   }
// };



// Create ./templates/ with:
// leadership_series.pdf
// technical_training.pdf
// default_certificate.pdf

// project_root/
// ├── templates/
// │   ├── leadership_series.pdf
// │   ├── technical_training.pdf
// │   ├── professional_development.pdf
// │   ├── default_certificate.pdf
// ├── controllers/
// │   ├── eventsController.js
// ├── models/
// │   ├── myMeeting.js
// ├── server.js