const mongoose = require('mongoose');
const DailyChallenge = require('../models/dailyCbChallenge');
const Plenary = require('../models/plenary');
const {Lsdc, DeptAccess } = require('../models/lsdc');
// Helper to format date
const formatDate = (date) => {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' :
                 day % 10 === 2 && day !== 12 ? 'nd' :
                 day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  
  return `${day}${suffix} ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
};


// Create a new daily challenge
exports.createDailyChallenge = async (req, res) => {
  try {
    const {
      date,
      supersessionId,
      externalTasks,
      dayNumber
    } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!date || !dayNumber) {
      return res.status(400).json({
        error: 'date and dayNumber are required'
      });
    }

    const challengeDate = new Date(date);
    challengeDate.setHours(0, 0, 0, 0);

    const existingChallenge = await DailyChallenge.findOne({ date: challengeDate });
    if (existingChallenge) {
      return res.status(400).json({
        error: `Daily challenge already exists for ${challengeDate.toISOString().split('T')[0]}`
      });
    }

    /* ---------------- DATE META ---------------- */
    const dayNames = [
      'Sunday', 'Monday', 'Tuesday',
      'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    const dayName = dayNames[challengeDate.getDay()];
    const formattedDate = formatDate(challengeDate);

    /* ---------------- TASK PREPARATION ---------------- */
    const tasks = [];

    /* 1️⃣ ADD EXTERNAL TASKS FIRST */
    if (Array.isArray(externalTasks)) {
      externalTasks.forEach((task, index) => {
        tasks.push({
          model: 'External',
          type: 'external',
          title: task.title,
          link: task.link || null,
          order: index + 1
        });
      });
    }

    /* 2️⃣ ADD PLENARY (VIDEO) LAST */
    if (supersessionId) {
      if (!mongoose.isValidObjectId(supersessionId)) {
        return res.status(400).json({ error: 'Invalid supersessionId' });
      }

      const supersession = await Plenary.findById(supersessionId);
      if (!supersession) {
        return res.status(404).json({ error: 'Supersession not found' });
      }

      // Mark plenary as challenge content
      supersession.challenge = {
        isChallengeContent: true,
        challengeDate
      };
      await supersession.save();

      tasks.push({
        contentId: supersession._id,
        model: 'Plenary',
        type: 'video',
        title: 'STDL Message of the day',
        order: tasks.length + 1 // ✅ ALWAYS LAST
      });
    }

    /* 3️⃣ FINAL SAFETY SORT */
    tasks.sort((a, b) => a.order - b.order);

    /* ---------------- CREATE CHALLENGE ---------------- */
    const challenge = new DailyChallenge({
      date: challengeDate,
      dayName,
      dayNumber,
      formattedDate,
      tasks,
      userProgress: [],
      isActive: true
    });

    await challenge.save();

    res.status(201).json({
      message: 'Daily challenge created successfully',
      challenge
    });

  } catch (error) {
    console.error('❌ Error creating daily challenge:', error);
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

exports.getUserChallengeStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    // 🔍 Fetch user info
    const user = await Lsdc.findById(
      userId,
      'title firstName lastName deptName'
    ).lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 🔍 Find challenges where user has progress
    const challenges = await DailyChallenge.find(
      { 'userProgress.userId': userId },
      {
        date: 1,
        dayName: 1,
        dayNumber: 1,
        formattedDate: 1,
        userProgress: 1
      }
    ).sort({ date: -1 }).lean();

    const progressSummary = challenges.map(challenge => {
      const progress = challenge.userProgress.find(
        p => p.userId.toString() === userId
      );

      return {
        challengeId: challenge._id,
        date: challenge.date,
        formattedDate: challenge.formattedDate,
        dayName: challenge.dayName,
        dayNumber: challenge.dayNumber,
        status: progress?.status || 'None',
        completed: progress?.completed || false,
        completionDate: progress?.completionDate || null,
        lastUpdated: progress?.lastUpdated || null
      };
    });

    return res.status(200).json({
      userId,
      name: [user.title, user.firstName, user.lastName].filter(Boolean).join(' '),
      department: user.deptName || 'Unknown',
      totalChallenges: progressSummary.length,
      progress: progressSummary
    });

  } catch (error) {
    console.error('❌ Error fetching user challenge status:', error);
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};


exports.upgradeUserStatusToGold = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const challenges = await DailyChallenge.find({
      "userProgress.userId": userId
    });

    if (!challenges.length) {
      return res.status(404).json({
        message: "User not found in any challenge"
      });
    }

    let updatedCount = 0;
    const now = new Date();

    for (const challenge of challenges) {
      challenge.userProgress.forEach(progress => {
        if (
          progress.userId.toString() === userId &&
          progress.status === "Silver"
        ) {
          progress.status = "Gold";
          progress.completed = true;
          progress.completionDate = now;
          progress.lastUpdated = now;

          updatedCount++;
        }
      });

      await challenge.save();
    }

    return res.status(200).json({
      message: "User upgraded to Gold in all challenges",
      upgradedChallenges: updatedCount
    });

  } catch (error) {
    console.error("Upgrade error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.upgradeUserToGoldForChallenge = async (req, res) => {
  try {
    const { challengeId, userId } = req.params;

    if (!mongoose.isValidObjectId(challengeId)) {
      return res.status(400).json({ error: 'Invalid challengeId' });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const challenge = await DailyChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Daily challenge not found' });
    }

    const userProgress = challenge.userProgress.find(
      p => p.userId.toString() === userId
    );

    if (!userProgress) {
      return res.status(404).json({
        error: 'User has no progress for this challenge'
      });
    }

    const now = new Date();
    const timestamp =
      `${now.getHours().toString().padStart(2, '0')}:` +
      `${now.getMinutes().toString().padStart(2, '0')}`;

    /* 🔥 FORCE-COMPLETE ALL TASKS */
    challenge.tasks.forEach(task => {
      let taskProgress = userProgress.tasks.find(
        t => t.taskId.toString() === task._id.toString()
      );

      if (taskProgress) {
        taskProgress.completed = true;
        taskProgress.completionDate = now;
        taskProgress.completionTimestamp = timestamp;
      } else {
        userProgress.tasks.push({
          taskId: task._id,
          completed: true,
          completionDate: now,
          completionTimestamp: timestamp
        });
      }
    });

    /* 🔥 FINAL STATUS */
    userProgress.status = 'Gold';
    userProgress.completed = true;
    userProgress.completionDate = now;
    userProgress.lastUpdated = now;

    await challenge.save();

    return res.status(200).json({
      message: 'User upgraded to Gold and ALL tasks completed',
      challengeId,
      userId,
      status: userProgress.status
    });

  } catch (error) {
    console.error('❌ Error upgrading user to Gold:', error);
    return res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

exports.upgradeAllSilverChallengesToGold = async (req, res) => {
  try {
    const { userId } = req.params;  // this is already a string

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid userId format' });
    }

    // ──────────────────────────────────────────────
    // Find all challenges where this user has status = "Silver"
    // Use STRING comparison (proven to work from your debug)
    // ──────────────────────────────────────────────
    const silverChallenges = await DailyChallenge.find({
      "userProgress.userId": userId,           // ← string
      "userProgress.status": "Silver"          // ← exact match
    }).select('_id date dayNumber dayName formattedDate userProgress tasks');

    if (silverChallenges.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No Silver challenges found for this user',
        upgradedCount: 0,
        userId,
        debugNote: 'Checked with string userId and status:"Silver"'
      });
    }

    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const operations = [];

    for (const challenge of silverChallenges) {
      // Find the correct userProgress subdocument (by string userId)
      const userProgIndex = challenge.userProgress.findIndex(
        p => p.userId.toString() === userId
      );

      if (userProgIndex === -1) continue; // safety

      const userProg = challenge.userProgress[userProgIndex];

      // Build map of already completed tasks (preserve original times)
      const completedMap = new Map();
      userProg.tasks.forEach(tp => {
        if (tp.completed) {
          completedMap.set(tp.taskId.toString(), {
            completionDate: tp.completionDate,
            completionTimestamp: tp.completionTimestamp,
          });
        }
      });

      // Force-complete all tasks
      const updatedTasks = challenge.tasks.map(task => {
        const taskIdStr = task._id.toString();
        const existing = completedMap.get(taskIdStr);

        if (existing) {
          return {
            taskId: task._id,
            completed: true,
            completionDate: existing.completionDate,
            completionTimestamp: existing.completionTimestamp,
          };
        }

        return {
          taskId: task._id,
          completed: true,
          completionDate: now,
          completionTimestamp: timestamp,
        };
      });

      // Prepare $set for this specific subdocument
      const setPath = `userProgress.${userProgIndex}`;

      operations.push({
        updateOne: {
          filter: { _id: challenge._id },
          update: {
            $set: {
              [`${setPath}.tasks`]: updatedTasks,
              [`${setPath}.status`]: 'Gold',
              [`${setPath}.completed`]: true,
              [`${setPath}.completionDate`]: now,
              [`${setPath}.lastUpdated`]: now,
            }
          }
        }
      });
    }

    // Execute bulk update
    const result = await DailyChallenge.bulkWrite(operations, { ordered: false });

    return res.status(200).json({
      success: true,
      message: `Upgraded ${silverChallenges.length} Silver challenge(s) to Gold`,
      upgradedCount: silverChallenges.length,
      userId,
      modifiedCount: result.modifiedCount,
      upgradedDays: silverChallenges.map(c => ({
        challengeId: c._id,
        formattedDate: c.formattedDate,
        dayNumber: c.dayNumber,
        dayName: c.dayName
      }))
    });

  } catch (error) {
    console.error('Error upgrading all silver → gold:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      details: error.message
    });
  }
};
// exports.upgradeUserToGoldForChallenge = async (req, res) => {
//   try {
//     const { challengeId, userId } = req.params;

//     /* ---------------- VALIDATION ---------------- */
//     if (!mongoose.isValidObjectId(challengeId)) {
//       return res.status(400).json({ error: 'Invalid challengeId' });
//     }

//     if (!mongoose.isValidObjectId(userId)) {
//       return res.status(400).json({ error: 'Invalid userId' });
//     }

//     /* ---------------- FETCH CHALLENGE ---------------- */
//     const challenge = await DailyChallenge.findById(challengeId);

//     if (!challenge) {
//       return res.status(404).json({ error: 'Daily challenge not found' });
//     }

//     /* ---------------- FIND USER PROGRESS ---------------- */
//     const userProgress = challenge.userProgress.find(
//       progress => progress.userId.toString() === userId
//     );

//     if (!userProgress) {
//       return res.status(404).json({
//         error: 'User has no progress for this challenge'
//       });
//     }

//     if (userProgress.status !== 'Silver') {
//       return res.status(400).json({
//         error: `User status is '${userProgress.status}', only Silver can be upgraded to Gold`
//       });
//     }

//     /* ---------------- UPGRADE STATUS ---------------- */
//     userProgress.status = 'Gold';
//     userProgress.completed = true;
//     userProgress.completionDate = new Date();
//     userProgress.lastUpdated = new Date();

//     await challenge.save();

//     return res.status(200).json({
//       message: 'User upgraded to Gold successfully',
//       challengeId,
//       userId,
//       status: userProgress.status,
//       completed: userProgress.completed,
//       completionDate: userProgress.completionDate
//     });

//   } catch (error) {
//     console.error('❌ Error upgrading user to Gold:', error);
//     return res.status(500).json({
//       error: 'Server error',
//       details: error.message
//     });
//   }
// };

// exports.upgradeUserStatusToGold = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     if (!mongoose.isValidObjectId(userId)) {
//       return res.status(400).json({ error: 'Invalid userId' });
//     }

//     const challenges = await DailyChallenge.find({
//       'userProgress.userId': userId,
//       'userProgress.status': 'Silver'
//     });

//     if (!challenges.length) {
//       return res.status(404).json({
//         message: 'No Silver status found for this user'
//       });
//     }

//     let updatedCount = 0;

//     for (const challenge of challenges) {
//       challenge.userProgress.forEach(progress => {
//         if (
//           progress.userId.toString() === userId &&
//           progress.status === 'Silver'
//         ) {
//           progress.status = 'Gold';
//           progress.completed = true;
//           progress.completionDate = new Date();
//           progress.lastUpdated = new Date();
//           updatedCount++;
//         }
//       });

//       await challenge.save();
//     }

//     return res.status(200).json({
//       message: 'User status upgraded to Gold successfully',
//       userId,
//       upgradedChallenges: updatedCount
//     });

//   } catch (error) {
//     console.error('❌ Error upgrading user status:', error);
//     res.status(500).json({
//       error: 'Server error',
//       details: error.message
//     });
//   }
// };



 exports.getTodaysChallenge = async (req, res) => {
   try {
     const { userId } = req.query; // Get userId from query
     const today = new Date();
     today.setHours(0, 0, 0, 0);

     const challenge = await DailyChallenge.findOne({ date: today })
       .populate({
         path: 'tasks.contentId',
         model: 'Plenary',
         select: 'title image media description',
       });

     if (!challenge) {
       return res.status(404).json({
         message: 'No daily challenge found for today',
       });
     }
    // console.log('--- DAILY CHALLENGE DEBUG ---');
    // challenge.tasks.forEach((task, index) => {
    //   console.log({
    //     index,
    //     taskTitle: task.title,
    //     taskModel: task.model,
    //     contentIdType: typeof task.contentId,
    //     contentIdValue: task.contentId,
    //     populatedTitle: task.contentId?.title || null,
    //   });
    // });
     // If userId is provided, get user's progress
     if (userId && mongoose.isValidObjectId(userId)) {
       const userProgress = challenge.userProgress.find(
         progress => progress.userId.toString() === userId
       );
       
       // Attach progress to each task for easier frontend consumption
       const tasksWithProgress = challenge.tasks.map(task => {
         const taskProgress = userProgress ? 
           userProgress.tasks.find(t => t.taskId.toString() === task._id.toString()) : 
           null;
         
         return {
           ...task.toObject(),
           userProgress: taskProgress || {
             completed: false,
             completionDate: null,
             completionTimestamp: null
           }
         };
       });

       return res.status(200).json({
         ...challenge.toObject(),
         tasks: tasksWithProgress,
         userProgress: userProgress || null
       });
     } else {
       // If no userId, return the challenge without user progress
       return res.status(200).json(challenge);
     }
   } catch (error) {
     console.error('❌ Error fetching daily challenge:', error);
     res.status(500).json({ message: 'Internal server error' });
   }
 };
// Get daily challenge by date
exports.getChallengeByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const { userId } = req.query; // Optional: to get user's progress

    const challengeDate = new Date(date);
    challengeDate.setHours(0, 0, 0, 0);

    const challenge = await DailyChallenge.findOne({ date: challengeDate })
      .populate({
        path: 'tasks.contentId',
        model: 'Plenary',
        select: 'title image media description',
        // match: { model: '' }
      });

    if (!challenge) {
      return res.status(404).json({ 
        message: 'No daily challenge found for this date' 
      });
    }

    // If userId is provided, get user's progress
    if (userId && mongoose.isValidObjectId(userId)) {
      const userProgress = challenge.userProgress.find(
        progress => progress.userId.toString() === userId
      );
      
      // Attach progress to each task for easier frontend consumption
      const tasksWithProgress = challenge.tasks.map(task => {
        const taskProgress = userProgress ? 
          userProgress.tasks.find(t => t.taskId.toString() === task._id.toString()) : 
          null;
        
        return {
          ...task.toObject(),
          userProgress: taskProgress || {
            completed: false,
            completionDate: null,
            completionTimestamp: null
          }
        };
      });

      res.status(200).json({
        ...challenge.toObject(),
        tasks: tasksWithProgress,
        userProgress: userProgress || null
      });
    } else {
      res.status(200).json(challenge);
    }

  } catch (error) {
    console.error('Error fetching challenge by date:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Add this to your existing getAllChallenges controller
// (Replace the entire exports.getAllChallenges function with this updated version)

// exports.getAllChallenge = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, startDate, endDate, userId } = req.query;
//     const skip = (page - 1) * limit;

//     let query = {};
    
//     if (startDate && endDate) {
//       query.date = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     }

//           let challenges = await DailyChallenge.find(query)
//       .sort({ date: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .select('date dayName dayNumber formattedDate tasks userProgress isActive')
//       .populate({
//         path: 'tasks.contentId',
//         model: 'Plenary',
//         select: 'title image media', // 👈 only what frontend needs
//       });
// // Loop through challenges and tasks to log the data
// // challenges.forEach(challenge => {
// //   challenge.tasks.forEach(task => {
// //     if (task.model === 'Plenary' && task.contentId) {
// //       console.log('--- Plenary Task ---');
// //       console.log('Title:', task.contentId.title);
// //       console.log('Image:', task.contentId.image);
// //       console.log('Media:', task.contentId.media);
// //     }
// //   });
// // });
//     const total = await DailyChallenge.countDocuments(query);

//     // If userId is provided, process userProgress to include only the user's progress (or default None)
//     if (userId && mongoose.isValidObjectId(userId)) {
//       const userObjectId = new mongoose.Types.ObjectId(userId);

//       challenges = challenges.map(challenge => {
//         // Filter to only this user's progress (there should be at most one)
//         challenge.userProgress = challenge.userProgress.filter(
//           progress => progress.userId.toString() === userId
//         );

//         // If no progress entry exists for this user, create a default "None" entry
//         if (challenge.userProgress.length === 0) {
//           const defaultProgress = {
//             userId: userObjectId,
//             tasks: challenge.tasks.map(task => ({
//               taskId: task._id,
//               completed: false,
//               completionDate: null,
//               completionTimestamp: null
//             })),
//             completed: false,
//             status: 'None',
//             lastUpdated: null
//           };
//           challenge.userProgress.push(defaultProgress);
//         } else {
//           // There is existing progress — ensure all tasks are represented (in case tasks were added later)
//           let userProgress = challenge.userProgress[0];
//           const userTaskIds = new Set(userProgress.tasks.map(t => t.taskId.toString()));

//           challenge.tasks.forEach(task => {
//             if (!userTaskIds.has(task._id.toString())) {
//               userProgress.tasks.push({
//                 taskId: task._id,
//                 completed: false,
//                 completionDate: null,
//                 completionTimestamp: null
//               });
//             }
//           });

//           // Recalculate overall status/completed based on tasks
//           const totalTasks = challenge.tasks.length;
//           const completedTasks = userProgress.tasks.filter(t => t.completed).length;
//           userProgress.completed = completedTasks === totalTasks;
//           userProgress.status = userProgress.completed ? 'Gold' : (completedTasks > 0 ? 'Silver' : 'None');
//         }

//         return challenge;
//       });
//     }

//     res.status(200).json({
//       challenges,
//       total,
//       page: parseInt(page),
//       pages: Math.ceil(total / limit)
//     });
//   } catch (error) {
//     console.error('Error fetching all challenges:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };



exports.getAllChallenge = async (req, res) => {
  try {
    const { page = 1, limit = 100, startDate, endDate, userId } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // let challenges = await DailyChallenge.find(query)
    //   .sort({ date: -1 })
    //   .skip(skip)
    //   .limit(parseInt(limit))
    //   .select('date dayName dayNumber formattedDate tasks userProgress isActive');
          let challenges = await DailyChallenge.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('date dayName dayNumber formattedDate tasks userProgress isActive')
      .populate({
        path: 'tasks.contentId',
        model: 'Plenary',
        select: 'title image media', // 👈 only what frontend needs
      });

    const total = await DailyChallenge.countDocuments(query);

    // If userId is provided, process userProgress to include only the user's progress (or default None)
    if (userId && mongoose.isValidObjectId(userId)) {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      challenges = challenges.map(challenge => {
        // Filter to only this user's progress (there should be at most one)
        challenge.userProgress = challenge.userProgress.filter(
          progress => progress.userId.toString() === userId
        );

        // If no progress entry exists for this user, create a default "None" entry
        if (challenge.userProgress.length === 0) {
          const defaultProgress = {
            userId: userObjectId,
            tasks: challenge.tasks.map(task => ({
              taskId: task._id,
              completed: false,
              completionDate: null,
              completionTimestamp: null
            })),
            completed: false,
            status: 'None',
            lastUpdated: null
          };
          challenge.userProgress.push(defaultProgress);
        } else {
          // There is existing progress — ensure all tasks are represented (in case tasks were added later)
          let userProgress = challenge.userProgress[0];
          const userTaskIds = new Set(userProgress.tasks.map(t => t.taskId.toString()));

          challenge.tasks.forEach(task => {
            if (!userTaskIds.has(task._id.toString())) {
              userProgress.tasks.push({
                taskId: task._id,
                completed: false,
                completionDate: null,
                completionTimestamp: null
              });
            }
          });

          // Recalculate overall status/completed based on tasks
          const totalTasks = challenge.tasks.length;
          const completedTasks = userProgress.tasks.filter(t => t.completed).length;
          userProgress.completed = completedTasks === totalTasks;
          userProgress.status = userProgress.completed ? 'Gold' : (completedTasks > 0 ? 'Silver' : 'None');
        }

        return challenge;
      });
    }

    res.status(200).json({
      challenges,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching all challenges:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



// // Get all challenges (with pagination)
exports.getAllChallenges = async (req, res) => {
  try {
    const { page = 1, limit = 100, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const challenges = await DailyChallenge.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('date dayName dayNumber formattedDate tasks userProgress isActive');

    const total = await DailyChallenge.countDocuments(query);

    res.status(200).json({
      challenges,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching all challenges:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// // // Get all challenges (with pagination)
// exports.getAllChallenges = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, startDate, endDate } = req.query;
//     const skip = (page - 1) * limit;

//     let query = {};
    
//     if (startDate && endDate) {
//       query.date = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     }

//     const challenges = await DailyChallenge.find(query)
//       .sort({ date: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .select('date dayName dayNumber formattedDate tasks userProgress isActive');

//     const total = await DailyChallenge.countDocuments(query);

//     res.status(200).json({
//       challenges,
//       total,
//       page: parseInt(page),
//       pages: Math.ceil(total / limit)
//     });
//   } catch (error) {
//     console.error('Error fetching all challenges:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };



// Mark task as completed
exports.markTaskCompleted = async (req, res) => {
  try {
    const { challengeId, taskId } = req.params;
    const { userId, completionTimestamp } = req.body;

    if (!mongoose.isValidObjectId(challengeId) || 
        !mongoose.isValidObjectId(taskId) || 
        !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid IDs' });
    }

    const challenge = await DailyChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Daily challenge not found' });
    }

    // Check if task exists
    const task = challenge.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const now = new Date();

    // Find or create user progress
    let userProgress = challenge.userProgress.find(
      progress => progress.userId.toString() === userId
    );

    if (!userProgress) {
      userProgress = {
        userId: new mongoose.Types.ObjectId(userId),
        tasks: [{
          taskId: task._id,
          completed: true,
          completionDate: now,
          completionTimestamp: completionTimestamp || 
                              `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        }],
        completed: false,
        status: 'Silver',
        lastUpdated: now
      };
      challenge.userProgress.push(userProgress);
    } else {
      // Update existing task progress
      let taskProgress = userProgress.tasks.find(
        t => t.taskId.toString() === taskId
      );

      if (taskProgress) {
        taskProgress.completed = true;
        taskProgress.completionDate = now;
        taskProgress.completionTimestamp = completionTimestamp;
      } else {
        userProgress.tasks.push({
          taskId: task._id,
          completed: true,
          completionDate: now,
          completionTimestamp: completionTimestamp
        });
      }

      userProgress.lastUpdated = now;
    }

    // Calculate overall status
    const totalTasks = challenge.tasks.length;
    const completedTasks = userProgress.tasks.filter(t => t.completed).length;
    
    if (completedTasks === totalTasks) {
      userProgress.completed = true;
      userProgress.status = 'Gold';
      userProgress.completionDate = now;
    } else if (completedTasks > 0) {
      userProgress.completed = false;
      userProgress.status = 'Silver';
    } else {
      userProgress.completed = false;
      userProgress.status = 'None';
    }

    // Ensure all tasks are represented
    const userTaskIds = userProgress.tasks.map(t => t.taskId.toString());
    challenge.tasks.forEach(challengeTask => {
      const taskIdStr = challengeTask._id.toString();
      if (!userTaskIds.includes(taskIdStr)) {
        userProgress.tasks.push({
          taskId: challengeTask._id,
          completed: false,
          completionDate: null,
          completionTimestamp: null
        });
      }
    });

    await challenge.save();

    res.status(200).json({
      message: 'Task marked as completed',
      challenge,
      userProgress: challenge.userProgress.find(
        p => p.userId.toString() === userId
      )
    });

  } catch (error) {
    console.error('Error marking task as completed:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
};

// GET /api/departments/verify?deptID=100730
exports.verifyDeptID = async (req, res) => {
  try {
    const { deptID } = req.query;

    if (!deptID) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required',
      });
    }

    const department = await Lsdc.findOne({ deptID }).select(
      'deptID deptName'
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Department ID',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Department verified',
      department: {
        deptID: department.deptID,
        deptName: department.deptName,
      },
    });

  } catch (error) {
    console.error('verifyDeptID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};


//users-by-department
// exports.getDailyChallengeUsersByDepartment = async (req, res) => {
//   try {
//     const { challengeId } = req.params;

//     if (!mongoose.isValidObjectId(challengeId)) {
//       return res.status(400).json({ error: 'Invalid challengeId' });
//     }

//     const challenge = await DailyChallenge.findById(
//       challengeId,
//       { userProgress: 1, date: 1, dayName: 1 }
//     )
//       .populate({
//         path: 'userProgress.userId',
//         model: 'Lsdc',
//         select: 'title firstName lastName deptName'
//       })
//       .lean();

//     if (!challenge) {
//       return res.status(404).json({ error: 'Daily challenge not found' });
//     }

//     // 🔹 Group users by department
//     const departmentMap = {};

//     challenge.userProgress.forEach(progress => {
//       const user = progress.userId;

//       const deptName = user?.deptName || 'Unknown';

//       if (!departmentMap[deptName]) {
//         departmentMap[deptName] = [];
//       }

//       departmentMap[deptName].push({
//         userId: user?._id || null,
//         name: user
//           ? [user.title, user.firstName, user.lastName]
//               .filter(Boolean)
//               .join(' ')
//           : 'Unknown',
//         department: deptName,

//         status: progress.status,
//         completed: progress.completed,
//         completionDate: progress.completionDate || null,
//         lastUpdated: progress.lastUpdated
//       });
//     });

//     return res.status(200).json({
//       challengeId: challenge._id,
//       date: challenge.date,
//       dayName: challenge.dayName,
//       departments: departmentMap
//     });

//   } catch (error) {
//     console.error('Error fetching challenge users by department:', error);
//     return res.status(500).json({
//       error: 'Server error',
//       details: error.message
//     });
//   }
// };

exports.getDailyChallengeUsersByDepartment = async (req, res) => {
  try {
    const { challengeId } = req.params;

    if (!mongoose.isValidObjectId(challengeId)) {
      return res.status(400).json({ error: 'Invalid challengeId' });
    }

    const challenge = await DailyChallenge.findById(
      challengeId,
      { userProgress: 1, date: 1, dayName: 1 }
    )
      .populate({
        path: 'userProgress.userId',
        model: 'Lsdc',
        select: 'title firstName lastName deptName'
      })
      .lean();

    if (!challenge) {
      return res.status(404).json({ error: 'Daily challenge not found' });
    }

    // 🔹 Group users by department WITH COUNTS
    const departmentMap = {};
    let totalParticipants = 0;

    challenge.userProgress.forEach(progress => {
      const user = progress.userId;
      const deptName = user?.deptName || 'Unknown';

      if (!departmentMap[deptName]) {
        departmentMap[deptName] = {
          department: deptName,
          totalParticipants: 0,
          users: []
        };
      }

      departmentMap[deptName].users.push({
        userId: user?._id || null,
        name: user
          ? [user.title, user.firstName, user.lastName]
              .filter(Boolean)
              .join(' ')
          : 'Unknown',
        department: deptName,
        status: progress.status,
        completed: progress.completed,
        completionDate: progress.completionDate || null,
        lastUpdated: progress.lastUpdated
      });

      departmentMap[deptName].totalParticipants += 1;
      totalParticipants += 1;
    });

    return res.status(200).json({
      challengeId: challenge._id,
      date: challenge.date,
      dayName: challenge.dayName,

      // ✅ overall count
      totalParticipants,

      // ✅ per-department breakdown
      departments: departmentMap
    });

  } catch (error) {
    console.error('Error fetching challenge users by department:', error);
    return res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

// exports.getDailyChallengeUsersByDeptID = async (req, res) => {
//   try {
//     const { challengeId } = req.params;
//     const { deptID } = req.query; // The deptID to filter by

//     if (!mongoose.isValidObjectId(challengeId)) {
//       return res.status(400).json({ error: 'Invalid challengeId' });
//     }

//     if (!deptID || typeof deptID !== 'string') {
//       return res.status(400).json({ error: 'deptID is required' });
//     }

//     const challenge = await DailyChallenge.findById(
//       challengeId,
//       { userProgress: 1, date: 1, dayName: 1 }
//     )
//       .populate({
//         path: 'userProgress.userId',
//         model: 'Lsdc',
//         select: 'title firstName lastName deptID deptName'
//       })
//       .lean();

//     if (!challenge) {
//       return res.status(404).json({ error: 'Daily challenge not found' });
//     }

//     // Filter users by deptID
//     const usersInDept = challenge.userProgress
//       .filter(progress => progress.userId && progress.userId.deptID === deptID)
//       .map(progress => {
//         const user = progress.userId;
//         return {
//           userId: user?._id || null,
//           name: user
//             ? [user.title, user.firstName, user.lastName].filter(Boolean).join(' ')
//             : 'Unknown',
//           deptID: user?.deptID || 'Unknown',
//           deptName: user?.deptName || 'Unknown',
//           status: progress.status,
//           completed: progress.completed,
//           completionDate: progress.completionDate || null,
//           lastUpdated: progress.lastUpdated
//         };
//       });

//     return res.status(200).json({
//       challengeId: challenge._id,
//       date: challenge.date,
//       dayName: challenge.dayName,
//       deptID,
//       totalUsers: usersInDept.length,
//       completed: usersInDept.filter(u => u.completed).length,
//       pending: usersInDept.filter(u => !u.completed).length,
//       users: usersInDept
//     });

//   } catch (error) {
//     console.error('Error fetching challenge users by deptID:', error);
//     return res.status(500).json({
//       error: 'Server error',
//       details: error.message
//     });
//   }
// };



exports.getDailyChallengeUsersByDeptID = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { deptID } = req.query;

    if (!mongoose.isValidObjectId(challengeId)) {
      return res.status(400).json({ message: 'Invalid challengeId' });
    }

    if (!deptID) {
      return res.status(400).json({ message: 'deptID is required' });
    }

    // Find the challenge
    const challenge = await DailyChallenge.findById(challengeId)
      .populate({
        path: 'userProgress.userId',
        model: 'Lsdc',
        select: 'title firstName lastName deptName deptID'
      })
      .lean();

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Filter users by deptID
    const users = challenge.userProgress
      .filter(p => p.userId?.deptID?.toString() === deptID.toString())
      .map(p => ({
        userId: p.userId._id,
        name: [p.userId.title, p.userId.firstName, p.userId.lastName].filter(Boolean).join(' '),
        deptName: p.userId.deptName,
        completed: p.completed,
        status: p.status,
        tasks: p.tasks.map(t => ({
          taskId: t.taskId,
          completed: t.completed,
          completionDate: t.completionDate,
          completionTimestamp: t.completionTimestamp
        })),
      }));

    res.status(200).json({ users });

  } catch (error) {
    console.error('Error fetching users by dept:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// // Get user's challenge statistics
// exports.getUserStats = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { startDate, endDate } = req.query;

//     if (!mongoose.isValidObjectId(userId)) {
//       return res.status(400).json({ error: 'Invalid userId' });
//     }

//     let query = { 
//       'userProgress.userId': new mongoose.Types.ObjectId(userId) 
//     };

//     if (startDate && endDate) {
//       query.date = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     }

//     const challenges = await DailyChallenge.find(query)
//       .select('date dayName dayNumber userProgress')
//       .sort({ date: -1 });

//     const stats = {
//       totalChallenges: challenges.length,
//       goldChallenges: 0,
//       silverChallenges: 0,
//       completedChallenges: 0,
//       streak: 0,
//       currentStreak: 0,
//       challenges: challenges.map(challenge => {
//         const userProgress = challenge.userProgress.find(
//           p => p.userId.toString() === userId
//         );
        
//         return {
//           date: challenge.date,
//           dayName: challenge.dayName,
//           dayNumber: challenge.dayNumber,
//           status: userProgress?.status || 'None',
//           completed: userProgress?.completed || false
//         };
//       })
//     };

//     // Calculate streaks and counts
//     let currentStreak = 0;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     for (let i = 0; i < stats.challenges.length; i++) {
//       const challenge = stats.challenges[i];
      
//       if (challenge.status === 'Gold') {
//         stats.goldChallenges++;
//         if (challenge.completed) stats.completedChallenges++;
//       } else if (challenge.status === 'Silver') {
//         stats.silverChallenges++;
//       }

//       // Calculate current streak (consecutive days with Gold status)
//       if (challenge.status === 'Gold') {
//         if (i === 0) {
//           currentStreak = 1;
//         } else {
//           const prevDate = new Date(stats.challenges[i-1].date);
//           const currentDate = new Date(challenge.date);
//           const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
          
//           if (diffDays === 1) {
//             currentStreak++;
//           } else {
//             break;
//           }
//         }
//       }
//     }

//     stats.currentStreak = currentStreak;
//     stats.streak = Math.max(...[stats.challenges.reduce((max, challenge, index, arr) => {
//       if (challenge.status === 'Gold') {
//         if (index === 0 || arr[index-1].status !== 'Gold') {
//           let streak = 1;
//           for (let j = index + 1; j < arr.length; j++) {
//             if (arr[j].status === 'Gold' && 
//                 Math.floor((new Date(arr[j].date) - new Date(arr[j-1].date)) / (1000 * 60 * 60 * 24)) === 1) {
//               streak++;
//             } else {
//               break;
//             }
//           }
//           return Math.max(max, streak);
//         }
//       }
//       return max;
//     }, 0), currentStreak]);

//     res.status(200).json(stats);
//   } catch (error) {
//     console.error('Error getting user stats:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    // Always fetch challenges in ASCENDING order for streak logic
    const challenges = await DailyChallenge.find({
      'userProgress.userId': new mongoose.Types.ObjectId(userId),
    })
      .populate('tasks.contentId')
      .select('date dayName dayNumber tasks userProgress')
      .sort({ date: 1 });

    let stats = {
      totalChallenges: challenges.length,
      goldChallenges: 0,
      silverChallenges: 0,
      noneChallenges: 0,
      completedChallenges: 0,
      currentStreak: 0,
      longestStreak: 0,
      challenges: [],
    };

    let currentStreak = 0;
    let longestStreak = 0;
    let prevDate = null;

    challenges.forEach(challenge => {
      const progress = challenge.userProgress.find(
        p => p.userId.toString() === userId
      );

      const totalTasks = challenge.tasks.length;
      const completedTasks =
        progress?.tasks?.filter(t => t.completed).length || 0;

      let status = 'None';

      if (completedTasks === totalTasks && totalTasks > 0) {
        status = 'Gold';
        stats.goldChallenges++;
        stats.completedChallenges++;
      } else if (completedTasks > 0) {
        status = 'Silver';
        stats.silverChallenges++;
      } else {
        stats.noneChallenges++;
      }

      // ----- STREAK LOGIC -----
      if (status === 'Gold') {
        if (!prevDate) {
          currentStreak = 1;
        } else {
          const diffDays =
            (challenge.date - prevDate) / (1000 * 60 * 60 * 24);

          currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
        }

        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }

      prevDate = challenge.date;

      stats.challenges.push({
        date: challenge.date,
        dayName: challenge.dayName,
        dayNumber: challenge.dayNumber,
        status,
        completedTasks,
        totalTasks,
      });
    });

    stats.currentStreak = currentStreak;
    stats.longestStreak = longestStreak;

    res.status(200).json(stats);

  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// // Get all challenges (with pagination)
// exports.getAllChallenges = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, startDate, endDate } = req.query;
//     const skip = (page - 1) * limit;

//     let query = {};
    
//     if (startDate && endDate) {
//       query.date = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     }

//     const challenges = await DailyChallenge.find(query)
//       .sort({ date: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .select('date dayName dayNumber formattedDate tasks userProgress isActive');

//     const total = await DailyChallenge.countDocuments(query);

//     res.status(200).json({
//       challenges,
//       total,
//       page: parseInt(page),
//       pages: Math.ceil(total / limit)
//     });
//   } catch (error) {
//     console.error('Error fetching all challenges:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// Mark task as completed
// exports.createDailyChallenge = async (req, res) => {
//   try {
//     const { 
//       date, 
//       supersessionId, 
//       externalTasks, 
//       dayNumber 
//     } = req.body;

//     if (!date || !dayNumber) {
//       return res.status(400).json({ 
//         error: 'date and dayNumber are required' 
//       });
//     }

//     const challengeDate = new Date(date);
//     challengeDate.setHours(0, 0, 0, 0);

//     // Check if daily challenge already exists for this date
//     const existingChallenge = await DailyChallenge.findOne({ date: challengeDate });
//     if (existingChallenge) {
//       return res.status(400).json({ 
//         error: `Daily challenge already exists for ${challengeDate.toISOString().split('T')[0]}` 
//       });
//     }

//     const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//     const dayName = dayNames[challengeDate.getDay()];
//     const formattedDate = formatDate(challengeDate);

//     // Prepare tasks array
//     const tasks = [];

//     // Add Supersession task if provided
//     if (supersessionId) {
//       if (!mongoose.isValidObjectId(supersessionId)) {
//         return res.status(400).json({ error: 'Invalid supersessionId' });
//       }

//       const supersession = await Plenary.findById(supersessionId);
//       if (!supersession) {
//         return res.status(404).json({ error: 'Supersession not found' });
//       }

//       // Mark supersession as challenge content
//       supersession.challenge = {
//         isChallengeContent: true,
//         challengeDate: challengeDate
//       };
//       await supersession.save();

//       tasks.push({
//         contentId: supersession._id,
//         model: 'Plenary',
//         type: 'video',
//         title: 'STDL Message of the day',
//         order: 1
//       });
//     }

//     // Add external tasks
//     if (externalTasks && Array.isArray(externalTasks)) {
//       externalTasks.forEach((task, index) => {
//         tasks.push({
//           model: 'External',
//           type: 'external',
//           title: task.title,
//           link: task.link,
//           order: tasks.length + 1
//         });
//       });
//     }

//     // Create the daily challenge
//     const challenge = new DailyChallenge({
//       date: challengeDate,
//       dayName,
//       dayNumber,
//       formattedDate,
//       tasks,
//       userProgress: []
//     });

//     await challenge.save();

//     res.status(201).json({ 
//       message: 'Daily challenge created successfully', 
//       challenge 
//     });

//   } catch (error) {
//     console.error('Error creating daily challenge:', error);
//     res.status(500).json({ 
//       error: 'Server error', 
//       details: error.message 
//     });
//   }
// };
// // Get today's daily challenge
// exports.getTodaysChallenge = async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const challenge = await DailyChallenge.findOne({ date: today })
//       .populate({
//         path: 'tasks.contentId',
//         model: 'Plenary',
//         select: 'title image media description',
//       });

//     if (!challenge) {
//       return res.status(404).json({
//         message: 'No daily challenge found for today',
//       });
//     }

//     // 🔍 DEBUG LOGS (VERY IMPORTANT)
//     console.log('--- DAILY CHALLENGE DEBUG ---');
//     challenge.tasks.forEach((task, index) => {
//     //   console.log({
//     //     index,
//     //     taskTitle: task.title,
//     //     taskModel: task.model,
//     //     contentIdType: typeof task.contentId,
//     //     contentIdValue: task.contentId,
//     //     populatedTitle: task.contentId?.title || null,
//     //   });
//     });
//     // console.log('----------------------------');

//     res.status(200).json(challenge);
//   } catch (error) {
//     console.error('❌ Error fetching daily challenge:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };


// // Get today's daily challenge
// exports.getTodaysChallenge = async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const challenge = await DailyChallenge.findOne({ date: today })
//       .populate({
//         path: 'tasks.contentId',
//         model: 'Plenary',
//         select: 'title image media description',
//         match: { model: 'Plenary' }
//       });

//     if (!challenge) {
//       return res.status(404).json({ 
//         message: 'No daily challenge found for today' 
//       });
//     }

//     res.status(200).json(challenge);
//   } catch (error) {
//     console.error('Error fetching daily challenge:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };
