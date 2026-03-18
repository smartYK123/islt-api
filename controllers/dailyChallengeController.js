// const DailyChallenge = require('../models/DailyChallenge');
// const Classroom = require('../models/classroom');
// const Cecbs = require('../models/cecbs');
// const Classics = require('../models/classics');
// const Plenary = require('../models/plenary');
// const OnDjob =  require('../models/OnDjob')
// const ExcellenceSeriesHF =  require('../models/excellenceSeriesHF')
// const Models = { Classroom, Cecbs, Classics, Plenary, OnDjob,ExcellenceSeriesHF };


// exports.createDailyChallenge = async (req, res) => {
//   try {
//     const { date, tasks } = req.body;
//     for (const task of tasks) {
//       const Model = Models[task.model];
//       if (!Model) return res.status(400).json({ error: 'Invalid model' });

//       const content = await Model.findById(task.contentId);
//       if (!content) return res.status(404).json({ error: `${task.model} not found` });

//       if (task.type === 'quiz' && !content.quiz?.length) {
//         return res.status(400).json({ error: 'No quiz available for this content' });
//       }
//     }

//     const challenge = new DailyChallenge({ date, tasks });
//     await challenge.save();
//     res.status(201).json(challenge);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.getDailyChallenge = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const { userId } = req.query; // Use query param for GET

//     console.log('Fetching daily challenge (GET):', { date, userId });

//     if (!userId) {
//       return res.status(400).json({ error: 'userId is required' });
//     }

//     let challenge = await DailyChallenge.findOne({ date })
//       .populate('tasks.contentId')
//       .lean();

//     if (!challenge) {
//       return res.status(404).json({ error: 'Challenge not found' });
//     }

//     // Convert challenge to a mutable object since lean() returns a plain JS object
//     challenge = { ...challenge };

//     // Find or initialize userProgress
//     let userProgress = challenge.userProgress.find(p => p.userId.toString() === userId.toString());
//     if (!userProgress) {
//       userProgress = { userId, completedTasks: [], completed: false };
//       await DailyChallenge.updateOne(
//         { _id: challenge._id },
//         { $push: { userProgress } },
//         { upsert: true }
//       );
//       challenge.userProgress.push(userProgress);
//     }

//     // Process each task
//     for (const task of challenge.tasks) {
//       const Model = { Classroom, Cecbs, Classics, Plenary, OnDjob,ExcellenceSeriesHF }[task.model];
//       if (!Model) {
//         console.warn(`Invalid model for task: ${task.model}`);
//         continue;
//       }

//       const content = await Model.findById(task.contentId);
//       if (!content) {
//         console.warn(`Content not found for task: ${task.contentId}`);
//         continue;
//       }

//       let taskProgress = userProgress.completedTasks.find(t => t.taskId.toString() === task._id.toString());
//       if (!taskProgress) {
//         taskProgress = { taskId: task._id, completed: false };
//         userProgress.completedTasks.push(taskProgress);
//       }

//       if (task.type === 'video') {
//         const watchProgress = content.watchProgress.find(p => p.userId.toString() === userId.toString());
//         taskProgress.completed = watchProgress?.completed || false;
//       } else if (task.type === 'quiz') {
//         const quizProgress = content.quizProgress.find(p => p.userId.toString() === userId.toString());
//         taskProgress.completed = quizProgress?.completed || false;
//         taskProgress.quizAnswers = quizProgress?.answers || [];
//       }
//     }

//     // Update completion status
//     userProgress.completed = userProgress.completedTasks.every(t => t.completed);
//     if (userProgress.completed && !userProgress.completionDate) {
//       userProgress.completionDate = new Date();
//     }

//     // Persist updated userProgress
//     // await DailyChallenge.updateOne(
//     //   { _id: challenge._id, 'userProgress.userId': userId },
//     //   {
//     //     $set: {
//     //       'userProgress.$': userProgress
//     //     }
//     //   },
//     //   { upsert: true }
//     // );
//     // await DailyChallenge.updateOne(
//     //   { _id: challenge._id, 'userProgress.userId': userId },
//     //   { $set: { 'userProgress.$': userProgress } },
//     //   { upsert: true }
//     // );
//     await DailyChallenge.updateOne(
//       { _id: challenge._id },
//       {
//         $push: {
//           userProgress: userProgress
//         }
//       }
//     );
    
//     // Refresh challenge to reflect updates
//     challenge = await DailyChallenge.findOne({ date })
//       .populate('tasks.contentId')
//       .lean();

//     res.json(challenge);
//   } catch (error) {
//     console.error('Error in getDailyChallenge:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
// exports.getChallengeHistory = async (req, res) => {
//   try {
//     const { userId } = req.query;

//     console.log('Fetching challenge history:', { userId });

//     if (!userId) {
//       return res.status(400).json({ error: 'userId is required' });
//     }

//     const challenges = await DailyChallenge.find({
//       'userProgress.userId': userId,
//     })
//       .populate('tasks.contentId')
//       .sort({ date: -1 }) // Sort by date descending (newest first)
//       .lean();

//     console.log('Challenges found:', challenges.length);

//     res.json(challenges);
//   } catch (error) {
//     console.error('Error in getChallengeHistory:', error);
//     res.status(500).json({ error: error.message });
//   }
// };


// // Update progress helper
// const updateUserProgressForTask = async (userId, task, content) => {
//   let completed = false;
//   let quizAnswers = [];

//   if (task.type === 'video') {
//     const watchProgress = content.watchProgress.find(p => p.userId.toString() === userId.toString());
//     completed = watchProgress?.completed || false;
//   } else if (task.type === 'quiz') {
//     const quizProgress = content.quizProgress.find(p => p.userId.toString() === userId.toString());
//     completed = quizProgress?.completed || false;
//     quizAnswers = quizProgress?.answers || [];
//   }

//   return { completed, quizAnswers };
// };

// // Main progress updater
// const updateDailyChallengeProgress = async ({ userId, challengeId, taskId }) => {
//   const challenge = await DailyChallenge.findById(challengeId);
//   if (!challenge) throw new Error('Challenge not found');

//   const task = challenge.tasks.find(t => t._id.toString() === taskId);
//   if (!task) throw new Error('Task not found');

//   const Model = Models[task.model];
//   if (!Model) throw new Error('Invalid model');

//   const content = await Model.findById(task.contentId);
//   if (!content) throw new Error(`${task.model} content not found`);

//   const { completed, quizAnswers } = await updateUserProgressForTask(userId, task, content);

//   let userProgress = challenge.userProgress.find(p => p.userId.toString() === userId.toString());
//   if (!userProgress) {
//     userProgress = { userId, completedTasks: [], completed: false };
//     challenge.userProgress.push(userProgress);
//   }

//   let taskProgress = userProgress.completedTasks.find(t => t.taskId.toString() === taskId);
//   if (!taskProgress) {
//     taskProgress = { taskId, completed: false };
//     userProgress.completedTasks.push(taskProgress);
//   }

//   taskProgress.completed = completed;
//   if (task.type === 'quiz') taskProgress.quizAnswers = quizAnswers;

//   const completedTaskIds = userProgress.completedTasks.filter(t => t.completed).map(t => t.taskId.toString());
//   const allCompleted = challenge.tasks.every(t => completedTaskIds.includes(t._id.toString()));

//   userProgress.completed = allCompleted;
//   if (userProgress.completed && !userProgress.completionDate) {
//     userProgress.completionDate = new Date();
//   }

//   await challenge.save();
// };

// // 👇 Auto progress update on quiz submit
// exports.submitQuiz = async (req, res) => {
//   try {
//     const { challengeId, taskId, answers } = req.body;
//     const { userId } = req.body;
//     const challenge = await DailyChallenge.findById(challengeId);
//     if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

//     const task = challenge.tasks.find(t => t._id.toString() === taskId);
//     if (!task || task.type !== 'quiz') return res.status(400).json({ error: 'Invalid task' });

//     const Model = Models[task.model];
//     const content = await Model.findById(task.contentId);
//     if (!content) return res.status(404).json({ error: `${task.model} not found` });

//     const quizProgress = { userId, answers: [], completed: false, score: 0 };

//     for (const answer of answers) {
//       const question = content.quiz.find(q => q._id.toString() === answer.questionId);
//       if (!question) return res.status(400).json({ error: 'Invalid question' });

//       const isCorrect = question.correctAnswer === answer.selectedAnswer;
//       quizProgress.answers.push({ questionId: answer.questionId, selectedAnswer: answer.selectedAnswer, isCorrect });
//       if (isCorrect) quizProgress.score++;
//     }

//     quizProgress.completed = true; // consider marking completed regardless of correctness
//     content.quizProgress.push(quizProgress);
//     await content.save();

//     await updateDailyChallengeProgress({ userId, challengeId, taskId });

//     res.json({ quizProgress });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // 👇 Auto progress update on video watch
// exports.markVideoAsWatched = async (req, res) => {
//   try {
//     const { challengeId, taskId } = req.body;
//     const { userId } = req.body;
//     await updateDailyChallengeProgress({ userId, challengeId, taskId });

//     res.json({ message: 'Video progress updated' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.markVideoAsWatchedAuto = async (req, res) => {
//   try {
//     const { model, id } = req.params;
//     const { userId } = req.body;

//     const Model = Models[model];
//     if (!Model) return res.status(400).json({ error: 'Invalid model' });

//     const content = await Model.findById(id);
//     if (!content) return res.status(404).json({ error: `${model} not found` });

//     if (!content.watchProgress) content.watchProgress = [];

//     const progress = content.watchProgress.find(p => p.userId.toString() === userId);

//     if (progress) {
//       progress.completed = true;
//     } else {
//       content.watchProgress.push({ userId, completed: true });
//     }

//     await content.save();

//     // ✅ Auto update challenge progress
//     const dailyChallenges = await DailyChallenge.find();

//     for (const challenge of dailyChallenges) {
//       for (const task of challenge.tasks) {
//         if (task.type === 'video' && task.model === model && task.contentId.toString() === id) {
//           await updateDailyChallengeProgress({ userId, challengeId: challenge._id, taskId: task._id });
//         }
//       }
//     }

//     res.json({ message: 'Video marked as watched and progress updated' });
//   } catch (error) {
//     console.error('Error in markVideoAsWatched:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.getCompletedUsers = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const challenge = await DailyChallenge.findOne({ date }).lean();
//     if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

//     const completedUsers = challenge.userProgress?.filter(p => p.completed) || [];
//     res.json({ completedUsers });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// exports.autoUpdateVideoProgressForAllUsers = async (req, res) => {
//   try {
//     const { challengeId, taskId } = req.body;

//     const challenge = await DailyChallenge.findById(challengeId);
//     if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

//     const task = challenge.tasks.find(t => t._id.toString() === taskId);
//     if (!task || task.type !== 'video') return res.status(400).json({ error: 'Invalid video task' });

//     const Model = Models[task.model];
//     const content = await Model.findById(task.contentId);
//     if (!content) return res.status(404).json({ error: `${task.model} content not found` });

//     const allUserWatchProgress = content.watchProgress || [];

//     for (const userProgressData of allUserWatchProgress) {
//       const userId = userProgressData.userId;
//       if (!userProgressData.completed) continue;

//       // Update individual user progress for this task
//       await updateDailyChallengeProgress({ userId, challengeId, taskId });
//     }

//     res.json({ message: 'Progress updated for all users who completed the video' });
//   } catch (error) {
//     console.error('Error in autoUpdateVideoProgressForAllUsers:', error);
//     res.status(500).json({ error: error.message });
//   }
// };


// exports.getChallengeHistory = async (req, res) => {
//   try {
//     const { userId } = req.query;

//     console.log('Fetching challenge history:', { userId });

//     if (!userId) {
//       return res.status(400).json({ error: 'userId is required' });
//     }

//     const challenges = await DailyChallenge.find({
//       'userProgress.userId': userId,
//     })
//       .populate('tasks.contentId')
//       .sort({ date: -1 }) // Sort by date descending (newest first)
//       .lean();

//     console.log('Challenges found:', challenges.length);

//     res.json(challenges);
//   } catch (error) {
//     console.error('Error in getChallengeHistory:', error);
//     res.status(500).json({ error: error.message });
//   }
// };




const mongoose = require('mongoose');

const DailyChallenge = require('../models/DailyChallenge');
const Classroom = require('../models/classroom');
const Cecbs = require('../models/cecbs');
const Classics = require('../models/classics');
const Plenary = require('../models/plenary');
const OnDjob = require('../models/OnDjob');
const ExcellenceSeriesHF = require('../models/excellenceSeriesHF');
// const User = require('../models/lsdc');
// const { User, DeptAccess } = require('../models/lsdc'); // Updated import
const { Lsdc: User, DeptAccess } = require('../models/lsdc');

const { v4: uuidv4 } = require('uuid');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;

const ExcelAns4u = require('../models/excelAns4u');
const Bltas = require('../models/bltse');
const ExcelStaffSeries = require('../models/excelStafSeries');
const SpotlightAward = require('../models/spotlightAward');
const SpotlightOnEx = require('../models/spotlightOnEx');
const FaithProclaim = require('../models/faithproclaim');
const GoalSettting = require('../models/goalSetttings');
const LoveStaffCulture = require('../models/loveCulture');
const HealthCare = require('../models/healthcare');
const MessageExcept = require('../models/messageExcerpt');
const LearningChallenge = require('../models/learningChallenge');
const Promo = require('../models/promo');
const SpotOnExMain = require('../models/spotOnexMain');
const Supersession = require('../models/supersession');

const Models = {
  Classroom,
  Cecbs,
  Classics,
  Plenary,
  OnDjob,
  ExcellenceSeriesHF,
  ExcelAns4u,
  Bltas,
  ExcelStaffSeries,
  SpotlightAward,
  SpotlightOnEx,
  GoalSettting,
  LoveStaffCulture,
  HealthCare,
  MessageExcept,
  LearningChallenge,
  Promo,
  SpotOnExMain,
  FaithProclaim,
  Supersession
};

// // Get users with Gold status in all daily challenges
// exports.getGoldStatusUsers = async (req, res) => {
//   try {
//     const result = await DailyChallenge.aggregate([
//       // Unwind userProgress to process each user's progress individually
//       { $unwind: "$userProgress" },
//       // Match only users with Gold status
//       { $match: { "userProgress.status": "Gold" } },
//       // Group by userId to collect all challenges for each user
//       {
//         $group: {
//           _id: "$userProgress.userId",
//           challengeCount: { $sum: 1 },
//           goldCount: { $sum: 1 }, // Count Gold statuses
//         },
//       },
//       // Lookup to join with Lsdc model to get user details
//       {
//         $lookup: {
//           from: "lsdcs", // Collection name for Lsdc model (lowercase plural)
//           localField: "_id",
//           foreignField: "_id",
//           as: "userDetails",
//         },
//       },
//       // Unwind userDetails to simplify the structure
//       { $unwind: "$userDetails" },
//       // Count total challenges for comparison
//       {
//         $lookup: {
//           from: "dailychallenges",
//           let: { userId: "$_id" },
//           pipeline: [
//             { $unwind: "$userProgress" },
//             { $match: { $expr: { $eq: ["$userProgress.userId", "$$userId"] } } },
//             { $count: "totalChallenges" },
//           ],
//           as: "challengeStats",
//         },
//       },
//       // Unwind challengeStats (handle case where user has no challenges)
//       {
//         $unwind: {
//           path: "$challengeStats",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       // Match users where the number of Gold statuses equals total challenges
//       {
//         $match: {
//           $expr: {
//             $eq: ["$challengeCount", "$challengeStats.totalChallenges"],
//           },
//         },
//       },
//       // Project only the required fields
//       {
//         $project: {
//           _id: 0,
//           title: "$userDetails.title",
//           firstName: "$userDetails.firstName",
//           deptName: "$userDetails.deptName",
//           lastName: "$userDetails.lastName",
//         },
//       },
//     ]);

//     res.json({
//       message: `Found ${result.length} users with Gold status in all their daily challenges.`,
//       users: result,
//     });
//   } catch (err) {
//     console.error('Error in getGoldStatusUsers:', err);
//     res.status(500).json({ error: err.message });
//   }
// };

exports.getGoldStatusUsers = async (req, res) => {
  try {
    const result = await DailyChallenge.aggregate([
      // Unwind userProgress to process each user's progress individually
      { $unwind: "$userProgress" },
      // Group by userId to collect all statuses for each user
      {
        $group: {
          _id: "$userProgress.userId",
          statuses: { $push: "$userProgress.status" },
          challengeCount: { $sum: 1 },
        },
      },
      // Filter users where ALL statuses are Gold
      {
        $match: {
          statuses: { $not: { $elemMatch: { $ne: "Gold" } } }, // No non-Gold statuses
          challengeCount: { $gt: 0 }, // Ensure user participated in at least one challenge
        },
      },
      // Lookup to join with Lsdc model to get user details
      {
        $lookup: {
          from: "lsdcs", // Collection name for Lsdc model
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      // Unwind userDetails to simplify the structure
      { $unwind: "$userDetails" },
      // Project only the required fields
      {
        $project: {
          _id: 0,
          title: "$userDetails.title",
          firstName: "$userDetails.firstName",
          deptName: "$userDetails.deptName",
          lastName: "$userDetails.lastName",
        },
      },
    ]);

    res.json({
      message: `Found ${result.length} users with Gold status in all their daily challenges.`,
      users: result,
    });
  } catch (err) {
    console.error('Error in getGoldStatusUsers:', err);
    res.status(500).json({ error: err.message });
  }
};

       // Create a new daily challenge
 exports.createDailyChallenge = async (req, res) => {
  try {
    const { date, tasks } = req.body;

    for (const task of tasks) {
      const Model = Models[task.model];
      if (!Model) return res.status(400).json({ error: `Invalid model: ${task.model}` });

      const content = await Model.findById(task.contentId);
      if (!content) return res.status(404).json({ error: `${task.model} content not found` });

      if (task.type === 'quiz' && (!content.quiz || content.quiz.length === 0)) {
        return res.status(400).json({ error: 'No quiz available for this content' });
      }
    }

    const challenge = await DailyChallenge.create({ date, tasks });
    res.status(201).json(challenge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// getDailyChallenge
// Get daily challenge for a specific date
exports.getDailyChallenge = async (req, res) => {
  try {
    const { date } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const challenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const mutableChallenge = { ...challenge };
    let userProgress = mutableChallenge.userProgress.find((p) => p.userId.toString() === userId);

    if (!userProgress) {
      userProgress = {
        userId,
        completedTasks: challenge.tasks.map((t) => ({
          taskId: t._id,
          completed: false,
        })),
        completed: false,
        status: 'None',
      };
      await DailyChallenge.updateOne(
        { _id: challenge._id },
        { $push: { userProgress } }
      );
    }

    // Sync task progress with content models
    for (const task of mutableChallenge.tasks) {
      const Model = Models[task.model];
      if (!Model) {
        console.warn(`Model not found: ${task.model}`);
        continue;
      }

      const content = await Model.findById(task.contentId);
      if (!content) {
        console.warn(`Content not found: ${task.contentId}`);
        continue;
      }

      let taskProgress = userProgress.completedTasks.find(
        (t) => t.taskId.toString() === task._id.toString()
      );
      if (!taskProgress) {
        taskProgress = { taskId: task._id, completed: false };
        userProgress.completedTasks.push(taskProgress);
      }

      if (task.type === 'video') {
        const watch = content.watchProgress?.find((p) => p.userId.toString() === userId);
        taskProgress.completed = watch?.completed || false;
      } else if (task.type === 'quiz') {
        const quizProgress = content.quizProgress?.find((p) => p.userId.toString() === userId);
        taskProgress.completed = quizProgress?.completed || false;
      }
    }

    // Update completion status
    userProgress.completed = userProgress.completedTasks.every((t) => t.completed);

    if (userProgress.completed) {
      if (!userProgress.completionDate) {
        userProgress.completionDate = new Date();
      }
      const createdAtDate = new Date(challenge.createdAt);
      const completionDate = new Date(userProgress.completionDate);
      const createdAtUTC = new Date(Date.UTC(
        createdAtDate.getUTCFullYear(),
        createdAtDate.getUTCMonth(),
        createdAtDate.getUTCDate()
      ));
      const completionUTC = new Date(Date.UTC(
        completionDate.getUTCFullYear(),
        completionDate.getUTCMonth(),
        completionDate.getUTCDate()
      ));
      userProgress.status = completionUTC.getTime() === createdAtUTC.getTime() ? 'Gold' : 'Silver';
    } else {
      userProgress.status = 'None';
      userProgress.completionDate = null;
    }

    // Save updated userProgress
    await DailyChallenge.updateOne(
      { _id: mutableChallenge._id, 'userProgress.userId': userId },
      { $set: { 'userProgress.$': userProgress } }
    );

    // Fetch updated challenge
    const updatedChallenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
    res.json(updatedChallenge);
  } catch (err) {
    console.error('Error in getDailyChallenge:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all challenges (completed and uncompleted) for a specific user
exports.getChallengeHistory  = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const challenges = await DailyChallenge.find({})
      .populate('tasks.contentId')
      .sort({ date: -1 })
      .lean();

    // Ensure userProgress exists for each challenge
    for (const challenge of challenges) {
      let userProgress = challenge.userProgress.find((p) => p.userId.toString() === userId);
      if (!userProgress) {
        userProgress = {
          userId,
          completedTasks: challenge.tasks.map((t) => ({
            taskId: t._id,
            completed: false,
          })),
          completed: false,
          status: 'None',
        };
        await DailyChallenge.updateOne(
          { _id: challenge._id },
          { $push: { userProgress } }
        );
        challenge.userProgress.push(userProgress);
      }

      // Sync task progress
      for (const task of challenge.tasks) {
        const Model = Models[task.model];
        if (!Model) continue;

        const content = await Model.findById(task.contentId);
        if (!content) continue;

        let taskProgress = userProgress.completedTasks.find(
          (t) => t.taskId.toString() === task._id.toString()
        );
        if (!taskProgress) {
          taskProgress = { taskId: task._id, completed: false };
          userProgress.completedTasks.push(taskProgress);
        }

        if (task.type === 'video') {
          const watch = content.watchProgress?.find((p) => p.userId.toString() === userId);
          taskProgress.completed = watch?.completed || false;
        } else if (task.type === 'quiz') {
          const quizProgress = content.quizProgress?.find((p) => p.userId.toString() === userId);
          taskProgress.completed = quizProgress?.completed || false;
        }
      }

      userProgress.completed = userProgress.completedTasks.every((t) => t.completed);
      if (userProgress.completed) {
        if (!userProgress.completionDate) {
          userProgress.completionDate = new Date();
        }
        const createdAtDate = new Date(challenge.createdAt);
        const completionDate = new Date(userProgress.completionDate);
        const createdAtUTC = new Date(Date.UTC(
          createdAtDate.getUTCFullYear(),
          createdAtDate.getUTCMonth(),
          createdAtDate.getUTCDate()
        ));
        const completionUTC = new Date(Date.UTC(
          completionDate.getUTCFullYear(),
          completionDate.getUTCMonth(),
          completionDate.getUTCDate()
        ));
        userProgress.status = completionUTC.getTime() === createdAtUTC.getTime() ? 'Gold' : 'Silver';
      } else {
        userProgress.status = 'None';
        userProgress.completionDate = null;
      }

      await DailyChallenge.updateOne(
        { _id: challenge._id, 'userProgress.userId': userId },
        { $set: { 'userProgress.$': userProgress } }
      );
    }

    // Refetch to ensure latest data
    const updatedChallenges = await DailyChallenge.find({})
      .populate('tasks.contentId')
      .sort({ date: -1 })
      .lean();

    res.json(updatedChallenges);
  } catch (err) {
    console.error('Error in getChallengeHistory:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get a user's status for a specific daily challenge
exports.getUserChallengeStatus = async (req, res) => {
  try {
    const { challengeId, userId } = req.params;

    // Validate ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ error: 'Invalid challengeId' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    // Find the challenge
    const challenge = await DailyChallenge.findById(challengeId).lean();
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Find the user's progress in the challenge
    const userProgress = challenge.userProgress.find(
      progress => progress.userId.toString() === userId
    );

    // If user has no progress in this challenge
    if (!userProgress) {
      return res.status(404).json({
        message: 'User has not participated in this challenge',
        challengeId,
        userId,
        status: null,
      });
    }

    // Fetch user details
    const user = await User.findById(userId).select('title firstName lastName deptName').lean();

    // Prepare response
    const response = {
      challengeId,
      userId,
      name: user ? `${user.title} ${user.firstName} ${user.lastName}`.trim() : 'Unknown',
      department: user?.deptName || 'Unknown',
      status: userProgress.status, // Gold, Silver, or None
    };

    res.json({
      message: `User status for challenge ${challengeId}`,
      userStatus: response,
    });
  } catch (err) {
    console.error('Error in getUserChallengeStatus:', err);
    res.status(500).json({ error: err.message });
  }
};

// // Get a user's status across all daily challenges
// exports.getUserAllChallengesStatus = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // Validate userId
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ error: 'Invalid userId' });
//     }

//     // Find all challenges where the user has progress
//     const challenges = await DailyChallenge.find({
//       'userProgress.userId': userId,
//     }).lean();

//     // Fetch user details
//     const user = await User.findById(userId).select('title firstName lastName deptName').lean();

//     // Map user progress across all challenges
//     const userStatuses = challenges.map(challenge => ({
//       challengeId: challenge._id,
//       date: challenge.date,
//       status: challenge.userProgress.find(
//         progress => progress.userId.toString() === userId
//       )?.status || 'None',
//     }));

//     // Prepare response
//     const response = {
//       userId,
//       name: user ? `${user.title} ${user.firstName} ${user.lastName}`.trim() : 'Unknown',
//       department: user?.deptName || 'Unknown',
//       challenges: userStatuses,
//     };

//     res.json({
//       message: `Found ${userStatuses.length} challenges for user ${userId}`,
//       userStatus: response,
//     });
//   } catch (err) {
//     console.error('Error in getUserAllChallengesStatus:', err);
//     res.status(500).json({ error: err.message });
//   }
// };


// Get a user's status across all daily challenges
exports.getUserAllChallengesStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    // Find all challenges where the user has progress
    const challenges = await DailyChallenge.find({
      'userProgress.userId': userId,
    }).lean();

    // Fetch user details
    const user = await User.findById(userId).select('title firstName lastName deptName portalID').lean();

    // Map user progress across all challenges
    const userStatuses = challenges.map(challenge => ({
      challengeId: challenge._id,
      date: challenge.date,
      status: challenge.userProgress.find(
        progress => progress.userId.toString() === userId
      )?.status || 'None',
    }));

    // Check if user has Gold status in all challenges
    const hasAllGold = userStatuses.length > 0 && userStatuses.every(
      status => status.status === 'Gold'
    );

    // Generate certificateId if eligible
    const certificateId = hasAllGold ? uuidv4() : null;

    // Prepare response
    const response = {
      userId,
      name: user ? `${user.title} ${user.firstName} ${user.lastName}`.trim() : 'Unknown',
      department: user?.deptName || 'Unknown',
      portalID: user?.portalID || 'Unknown',
      challenges: userStatuses,
      canDownloadCertificate: hasAllGold,
      certificateId: certificateId,
    };

    res.json({
      message: `Found ${userStatuses.length} challenges for user ${userId}`,
      userStatus: response,
    });
  } catch (err) {
    console.error('Error in getUserAllChallengesStatus:', err);
    res.status(500).json({ error: err.message });
  }
};




// Download certificate for daily challenges
exports.downloadChallengeCertificate = async (req, res) => {
  try {
    const { userId, certificateId } = req.params;

    // Validate userId
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    // Verify authenticated user (assuming authMiddleware sets req.user)
    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Check eligibility: User must have Gold in all challenges
    const challenges = await DailyChallenge.find({
      'userProgress.userId': userId,
    }).lean();

    const hasAllGold = challenges.length > 0 && challenges.every(challenge =>
      challenge.userProgress.find(
        progress => progress.userId.toString() === userId
      )?.status === 'Gold'
    );

    if (!hasAllGold) {
      return res.status(403).json({
        error: 'User is not eligible for certificate. All challenges must have Gold status.',
      });
    }

    // Fetch user details
    const user = await User.findById(userId).select('title firstName lastName deptName').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Load the certificate template
    const templatePath = './templates/certificateDLC.pdf';
    let templateBytes;
    try {
      templateBytes = await fs.readFile(templatePath);
      console.log(`Loaded template: ${templatePath}`);
    } catch (fileError) {
      console.error('Error reading template:', fileError);
      return res.status(500).json({ error: `Certificate template not found: ${templatePath}` });
    }

    // Create PDF document from template
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPage(0);
    const font = await pdfDoc.embedFont('Helvetica-Bold');

    const textColor = rgb(0, 0, 0);

    // Add user details to the certificate
    const fullName = `${user.title || ''} ${user.firstName} ${user.lastName}`.trim();
        page.drawText(fullName, {
      x: 260,
      y: 358,
      size: 18,
      font,
      color: textColor,
    });
    // const date = new Date().toLocaleDateString('en-US', {
    //   year: 'numeric',
    //   month: 'long',
    //   day: 'numeric',
    // });

    // page.drawText(fullName, {
    //   x: 200,
    //   y: 170,
    //   size: 18,
    //   font,
    //   color: textColor,
    // });

    // page.drawText('Daily Challenge Series', {
    //   x: 200,
    //   y: 140,
    //   size: 16,
    //   font,
    //   color: textColor,
    // });

    // page.drawText(date, {
    //   x: 200,
    //   y: 110,
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
    console.error('Error generating challenge certificate:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
//  Nektonit
  }
};






// exports.getDailyChallenge = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: 'userId is required' });

//     const challenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
//     if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

//     const mutableChallenge = { ...challenge };
//     let userProgress = mutableChallenge.userProgress.find((p) => p.userId.toString() === userId);

//     if (!userProgress) {
//       userProgress = { userId, completedTasks: [], completed: false, status: 'None' };
//       await DailyChallenge.updateOne(
//         { _id: challenge._id },
//         { $push: { userProgress } }
//       );
//     }

//     // Ensure all tasks have progress entries
//     for (const task of mutableChallenge.tasks) {
//       const Model = Models[task.model];
//       if (!Model) continue;

//       const content = await Model.findById(task.contentId);
//       if (!content) continue;

//       let taskProgress = userProgress.completedTasks.find((t) => t.taskId.toString() === task._id.toString());
//       if (!taskProgress) {
//         taskProgress = { taskId: task._id, completed: false };
//         userProgress.completedTasks.push(taskProgress);
//       }

//       if (task.type === 'video') {
//         const watch = content.watchProgress?.find((p) => p.userId.toString() === userId);
//         taskProgress.completed = watch?.completed || false;
//       } else if (task.type === 'quiz') {
//         // Add quiz completion logic (assuming a similar progress field)
//         const quizProgress = content.quizProgress?.find((p) => p.userId.toString() === userId);
//         taskProgress.completed = quizProgress?.completed || false;
//       }
//     }

//     // Check if all tasks are completed
//     userProgress.completed = userProgress.completedTasks.every((t) => t.completed);

//     // Update completionDate and status
//     if (userProgress.completed) {
//       if (!userProgress.completionDate) {
//         userProgress.completionDate = new Date();
//       }
//       const createdAtDate = new Date(challenge.createdAt);
//       const completionDate = new Date(userProgress.completionDate);
//       const createdAtUTC = new Date(Date.UTC(
//         createdAtDate.getUTCFullYear(),
//         createdAtDate.getUTCMonth(),
//         createdAtDate.getUTCDate()
//       ));
//       const completionUTC = new Date(Date.UTC(
//         completionDate.getUTCFullYear(),
//         completionDate.getUTCMonth(),
//         completionDate.getUTCDate()
//       ));
//       userProgress.status = completionUTC.getTime() === createdAtUTC.getTime() ? 'Gold' : 'Silver';
//     } else {
//       userProgress.status = 'None';
//       userProgress.completionDate = null;
//     }

//     // Save updated userProgress
//     await DailyChallenge.updateOne(
//       { _id: mutableChallenge._id, 'userProgress.userId': userId },
//       { $set: { 'userProgress.$': userProgress } }
//     );

//     // Fetch updated challenge to ensure latest data
//     const updatedChallenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
//     res.json(updatedChallenge);
//   } catch (err) {
//     console.error('Error in getDailyChallenge:', err);
//     res.status(500).json({ error: err.message });
//   }
// };


// // Get all completed challenges for a specific user
// exports.getChallengeHistory = async (req, res) => {
//   try {
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: 'userId is required' });

//     const history = await DailyChallenge.find({ 'userProgress.userId': userId })
//       .populate('tasks.contentId')
//       .sort({ date: -1 })
//       .lean();

//     res.json(history);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// Get all daily challenges
exports.getAllDailyChallenges = async (req, res) => {
  try {
    const challenges = await DailyChallenge.find({})
      .select('date tasks')
      .lean();
    res.json(challenges);
  } catch (err) {
    console.error('Error in getAllDailyChallenges:', err);
    res.status(500).json({ error: err.message });
  }
};

// Fix user progress for a specific challenge
exports.fixChallengeProgress = async (req, res) => {
  try {
    const { challengeId, userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(challengeId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid challengeId or userId' });
    }

    const challenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId');
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    let userProgress = challenge.userProgress.find((p) => p.userId.toString() === userId);
    if (!userProgress) {
      userProgress = { userId, completedTasks: [], completed: false, status: 'None' };
      challenge.userProgress.push(userProgress);
    }

    // Ensure all tasks have progress entries
    for (const task of challenge.tasks) {
      const Model = Models[task.model];
      if (!Model) continue;

      const content = await Model.findById(task.contentId);
      if (!content) continue;

      let taskProgress = userProgress.completedTasks.find((t) => t.taskId.toString() === task._id.toString());
      if (!taskProgress) {
        taskProgress = { taskId: task._id, completed: false };
        userProgress.completedTasks.push(taskProgress);
      }

      if (task.type === 'video') {
        const watch = content.watchProgress?.find((p) => p.userId.toString() === userId);
        taskProgress.completed = watch?.completed || false;
      } else if (task.type === 'quiz') {
        const quizProgress = content.quizProgress?.find((p) => p.userId.toString() === userId);
        taskProgress.completed = quizProgress?.completed || false;
      }
    }

    // Check if all tasks are completed
    userProgress.completed = userProgress.completedTasks.every((t) => t.completed);

    // Update completionDate and status
    if (userProgress.completed) {
      if (!userProgress.completionDate) {
        userProgress.completionDate = new Date();
      }
      const createdAtDate = new Date(challenge.createdAt);
      const completionDate = new Date(userProgress.completionDate);

      // Use UTC dates for comparison
      const createdAtUTC = new Date(Date.UTC(
        createdAtDate.getUTCFullYear(),
        createdAtDate.getUTCMonth(),
        createdAtDate.getUTCDate()
      ));
      const completionUTC = new Date(Date.UTC(
        completionDate.getUTCFullYear(),
        completionDate.getUTCMonth(),
        completionDate.getUTCDate()
      ));

      // Assign status: Gold if completed on the same UTC day, Silver otherwise
      userProgress.status = completionUTC.getTime() === createdAtUTC.getTime() ? 'Gold' : 'Silver';
    } else {
      userProgress.status = 'None';
      userProgress.completionDate = null; // Reset if incomplete
    }

    // Save updated userProgress
    await DailyChallenge.updateOne(
      { _id: challenge._id, 'userProgress.userId': userId },
      { $set: { 'userProgress.$': userProgress } }
    );

    // Fetch updated challenge to return
    const updatedChallenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId').lean();
    res.json({
      message: 'User progress updated successfully',
      challenge: updatedChallenge
    });
  } catch (err) {
    console.error('Error in fixChallengeProgress:', err);
    res.status(500).json({ error: err.message });
  }
};


// Get users with None status for a specific challenge
exports.getNoneStatusUsers = async (req, res) => {
  try {
    const { challengeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ error: 'Invalid challengeId' });
    }

    const challenge = await DailyChallenge.findById(challengeId).lean();
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Filter users with status None
    const noneStatusUsers = challenge.userProgress.filter(
      userProgress => userProgress.status === 'None'
    );

    // Fetch user information for None status users
    const userIds = noneStatusUsers.map(userProgress => userProgress.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('title firstName lastName deptName').lean();

    // Map user information to None status users
    const noneStatusUsersWithInfo = noneStatusUsers.map(userProgress => {
      const user = users.find(u => u._id.toString() === userProgress.userId.toString());
      if (!user) {
        console.log(`No user found for userId: ${userProgress.userId}`);
      }
      return {  
        userId: userProgress.userId,
        name: user ? `${user.title} ${user.firstName} ${user.lastName}`.trim() : 'Unknown',
        department: user?.deptName || 'Unknown',
        status: userProgress.status,
        completed: userProgress.completed,
        completionDate: userProgress.completionDate,
        completedTasks: userProgress.completedTasks
      };
    });

    res.json({
      message: `Found ${noneStatusUsersWithInfo.length} users with None status.`,
      challengeId,
      noneStatusUsers: noneStatusUsersWithInfo
    });
  } catch (err) {
    console.error('Error in getNoneStatusUsers:', err);
    res.status(500).json({ error: err.message });
  }
};




// Get users with Silver or None status for a specific challenge, including user information
exports.getNonGoldUsers = async (req, res) => {
  try {
    const { challengeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ error: 'Invalid challengeId' });
    }

    const challenge = await DailyChallenge.findById(challengeId).lean();
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Filter users with status Silver or None
    const nonGoldUsers = challenge.userProgress.filter(
      userProgress => userProgress.status === 'Silver' || userProgress.status === 'None'
    );

    // Fetch user information for non-Gold users
    const userIds = nonGoldUsers.map(userProgress => userProgress.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('title firstName lastName deptName').lean();

    // Map user information to non-Gold users
    const nonGoldUsersWithInfo = nonGoldUsers.map(userProgress => {
      const user = users.find(u => u._id.toString() === userProgress.userId.toString());
      if (!user) {
        console.log(`No user found for userId: ${userProgress.userId}`);
      }
      return {  
        userId: userProgress.userId,
        name: user ? `${user.title} ${user.firstName} ${user.lastName}`.trim() : 'Unknown',
        department: user?.deptName || 'Unknown',
        status: userProgress.status,
        completed: userProgress.completed,
        completionDate: userProgress.completionDate,
        completedTasks: userProgress.completedTasks
      };
    });

    res.json({
      message: `Found ${nonGoldUsersWithInfo.length} users with Silver or None status.`,
      challengeId,
      nonGoldUsers: nonGoldUsersWithInfo
    });
  } catch (err) {
    console.error('Error in getNonGoldUsers:', err);
    res.status(500).json({ error: err.message });
  }
};


// Assign Gold status to users with None status for a specific challenge
exports.assignGoldToNoneUsers = async (req, res) => {
  try {
    const { challengeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ error: 'Invalid challengeId' });
    }

    const challenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId');
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const updatedUserProgress = [...challenge.userProgress];
    let usersUpdated = 0;

    // Process users with status None
    for (let i = 0; i < updatedUserProgress.length; i++) {
      const userProgress = updatedUserProgress[i];
      if (userProgress.status !== 'None') {
        continue; // Skip users who are not None (Gold or Silver)
      }

      // Ensure completedTasks includes all tasks, mark them as completed
      userProgress.completedTasks = challenge.tasks.map(task => {
        const existingTask = userProgress.completedTasks.find(t => t.taskId.toString() === task._id.toString());
        return {
          taskId: task._id,
          completed: true,
          quizAnswers: existingTask?.quizAnswers || [],
          _id: existingTask?._id || new mongoose.Types.ObjectId()
        };
      });

      // Set Gold status requirements
      userProgress.completed = true;
      userProgress.status = 'Gold';
      userProgress.completionDate = new Date(challenge.createdAt); // Set to challenge createdAt for Gold status

      // Update quizProgress in content models for quiz tasks
      for (const task of challenge.tasks) {
        const Model = Models[task.model];
        if (!Model) {
          console.warn(`Model not found for task: ${task.model}`);
          continue;
        }

        const content = await Model.findById(task.contentId);
        if (!content) {
          console.warn(`Content not found for taskId: ${task._id}`);
          continue;
        }

        if (task.type === 'quiz') {
          let quizProgress = content.quizProgress?.find(p => p.userId.toString() === userProgress.userId.toString());
          if (!quizProgress) {
            // Create new quizProgress entry
            quizProgress = {
              userId: userProgress.userId,
              completed: true,
              date: new Date(challenge.createdAt),
              answers: []
            };
            content.quizProgress = content.quizProgress || [];
            content.quizProgress.push(quizProgress);
          } else {
            // Update existing quizProgress
            quizProgress.completed = true;
            quizProgress.date = new Date(challenge.createdAt);
            quizProgress.answers = quizProgress.answers || [];
          }
          await content.save();
        }
      }

      usersUpdated++;
      console.log('Assigned Gold status to None user:', {
        challengeId,
        userId: userProgress.userId,
        completionDate: userProgress.completionDate.toISOString(),
        status: userProgress.status
      });

      updatedUserProgress[i] = userProgress;
    }

    // Update the challenge with new userProgress
    if (usersUpdated > 0) {
      await DailyChallenge.updateOne(
        { _id: challenge._id },
        { $set: { userProgress: updatedUserProgress } }
      );
    }

    // Fetch updated challenge to return
    const updatedChallenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId').lean();
    res.json({
      message: `Processed ${updatedUserProgress.length} users. Assigned Gold status to ${usersUpdated} users with None status.`,
      challenge: updatedChallenge
    });
  } catch (err) {
    console.error('Error in assignGoldToNoneUsers:', err);
    res.status(500).json({ error: err.message });
  }
};


// Assign Silver status to users with None status and at least one completed task for a specific challenge
exports.assignSilverToNoneWithPartialCompletion = async (req, res) => {
  try {
    const { challengeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ error: 'Invalid challengeId' });
    }

    const challenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId');
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const updatedUserProgress = [...challenge.userProgress];
    let usersUpdated = 0;

    for (let i = 0; i < updatedUserProgress.length; i++) {
      const userProgress = updatedUserProgress[i];
      // Skip users who are not None or have no completed tasks
      if (userProgress.status !== 'None' || !userProgress.completedTasks.some(t => t.completed)) {
        continue;
      }

      userProgress.completedTasks = challenge.tasks.map(task => {
        const existingTask = userProgress.completedTasks.find(t => t.taskId.toString() === task._id.toString());
        return {
          taskId: task._id,
          completed: true,
          quizAnswers: existingTask?.quizAnswers || [],
          _id: existingTask?._id || new mongoose.Types.ObjectId()
        };
      });

      userProgress.completed = true;
      userProgress.status = 'Silver';
      userProgress.completionDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day to ensure Silver status

      for (const task of challenge.tasks) {
        const Model = Models[task.model];
        if (!Model) {
          console.warn(`Model not found for task: ${task.model}`);
          continue;
        }

        const content = await Model.findById(task.contentId);
        if (!content) {
          console.warn(`Content not found for taskId: ${task._id}`);
          continue;
        }

        if (task.type === 'quiz') {
          let quizProgress = content.quizProgress?.find(p => p.userId.toString() === userProgress.userId.toString());
          if (!quizProgress) {
            quizProgress = {
              userId: userProgress.userId,
              completed: true,
              date: userProgress.completionDate,
              answers: []
            };
            content.quizProgress = content.quizProgress || [];
            content.quizProgress.push(quizProgress);
          } else {
            quizProgress.completed = true;
            quizProgress.date = userProgress.completionDate;
            quizProgress.answers = quizProgress.answers || [];
          }
          await content.save();
        } else if (task.type === 'video') {
          let watchProgress = content.watchProgress?.find(p => p.userId.toString() === userProgress.userId.toString());
          if (!watchProgress) {
            watchProgress = {
              userId: userProgress.userId,
              completed: true,
              completionDate: userProgress.completionDate
            };
            content.watchProgress = content.watchProgress || [];
            content.watchProgress.push(watchProgress);
          } else {
            watchProgress.completed = true;
            watchProgress.completionDate = userProgress.completionDate;
          }
          await content.save();
        }
      }

      usersUpdated++;
      console.log('Assigned Silver status to None user with partial completion:', {
        challengeId,
        userId: userProgress.userId,
        completionDate: userProgress.completionDate.toISOString(),
        status: userProgress.status
      });

      updatedUserProgress[i] = userProgress;
    }

    if (usersUpdated > 0) {
      await DailyChallenge.updateOne(
        { _id: challenge._id },
        { $set: { userProgress: updatedUserProgress } }
      );
    }

    const updatedChallenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId').lean();
    res.json({
      message: `Processed ${updatedUserProgress.length} users. Assigned Silver status to ${usersUpdated} users with None status and at least one completed task.`,
      challenge: updatedChallenge
    });
  } catch (err) {
    console.error('Error in assignSilverToNoneWithPartialCompletion:', err);
    res.status(500).json({ error: err.message });
  }
};


// Assign Gold status to users with None status and at least one completed task for a specific challenge
exports.assignGoldToNoneWithPartialCompletion = async (req, res) => {
  try {
    const { challengeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ error: 'Invalid challengeId' });
    }

    const challenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId');
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const updatedUserProgress = [...challenge.userProgress];
    let usersUpdated = 0;

    for (let i = 0; i < updatedUserProgress.length; i++) {
      const userProgress = updatedUserProgress[i];
      // Skip users who are not None or have no completed tasks
      if (userProgress.status !== 'None' || !userProgress.completedTasks.some(t => t.completed)) {
        continue;
      }

      userProgress.completedTasks = challenge.tasks.map(task => {
        const existingTask = userProgress.completedTasks.find(t => t.taskId.toString() === task._id.toString());
        return {
          taskId: task._id,
          completed: true,
          quizAnswers: existingTask?.quizAnswers || [],
          _id: existingTask?._id || new mongoose.Types.ObjectId()
        };
      });

      userProgress.completed = true;
      userProgress.status = 'Gold';
      userProgress.completionDate = new Date(challenge.createdAt); // Same day as createdAt for Gold status

      for (const task of challenge.tasks) {
        const Model = Models[task.model];
        if (!Model) {
          console.warn(`Model not found for task: ${task.model}`);
          continue;
        }

        const content = await Model.findById(task.contentId);
        if (!content) {
          console.warn(`Content not found for taskId: ${task._id}`);
          continue;
        }

        if (task.type === 'quiz') {
          let quizProgress = content.quizProgress?.find(p => p.userId.toString() === userProgress.userId.toString());
          if (!quizProgress) {
            quizProgress = {
              userId: userProgress.userId,
              completed: true,
              date: userProgress.completionDate,
              answers: []
            };
            content.quizProgress = content.quizProgress || [];
            content.quizProgress.push(quizProgress);
          } else {
            quizProgress.completed = true;
            quizProgress.date = userProgress.completionDate;
            quizProgress.answers = quizProgress.answers || [];
          }
          await content.save();
        } else if (task.type === 'video') {
          let watchProgress = content.watchProgress?.find(p => p.userId.toString() === userProgress.userId.toString());
          if (!watchProgress) {
            watchProgress = {
              userId: userProgress.userId,
              completed: true,
              completionDate: userProgress.completionDate
            };
            content.watchProgress = content.watchProgress || [];
            content.watchProgress.push(watchProgress);
          } else {
            watchProgress.completed = true;
            watchProgress.completionDate = userProgress.completionDate;
          }
          await content.save();
        }
      }

      usersUpdated++;
      console.log('Assigned Gold status to None user with partial completion:', {
        challengeId,
        userId: userProgress.userId,
        completionDate: userProgress.completionDate.toISOString(),
        status: userProgress.status
      });

      updatedUserProgress[i] = userProgress;
    }

    if (usersUpdated > 0) {
      await DailyChallenge.updateOne(
        { _id: challenge._id },
        { $set: { userProgress: updatedUserProgress } }
      );
    }

    const updatedChallenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId').lean();
    res.json({
      message: `Processed ${updatedUserProgress.length} users. Assigned Gold status to ${usersUpdated} users with None status and at least one completed task.`,
      challenge: updatedChallenge
    });
  } catch (err) {
    console.error('Error in assignGoldToNoneWithPartialCompletion:', err);
    res.status(500).json({ error: err.message });
  }
};

// Assign Silver status to users with None status for a specific challenge
exports.assignSilverToNoneUsers = async (req, res) => {
  try {
    const { challengeId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ error: 'Invalid challengeId' });
    }

    const challenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId');
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const updatedUserProgress = [...challenge.userProgress];
    let usersUpdated = 0;
 // Hardcoded completion date
    const hardcodedCompletionDate = new Date('2025-05-18T00:00:00.000Z');
    for (let i = 0; i < updatedUserProgress.length; i++) {
      const userProgress = updatedUserProgress[i];
      if (userProgress.status !== 'None') {
        continue;
      }

      userProgress.completedTasks = challenge.tasks.map(task => {
        const existingTask = userProgress.completedTasks.find(t => t.taskId.toString() === task._id.toString());
        return {
          taskId: task._id,
          completed: true,
          quizAnswers: existingTask?.quizAnswers || [],
          _id: existingTask?._id || new mongoose.Types.ObjectId()
        };
      });

      userProgress.completed = true;
      userProgress.status = 'Silver';
      userProgress.completionDate = hardcodedCompletionDate;// Next day to ensure Silver status

      for (const task of challenge.tasks) {
        const Model = Models[task.model];
        if (!Model) {
          console.warn(`Model not found for task: ${task.model}`);
          continue;
        }

        const content = await Model.findById(task.contentId);
        if (!content) {
          console.warn(`Content not found for taskId: ${task._id}`);
          continue;
        }

        if (task.type === 'quiz') {
          let quizProgress = content.quizProgress?.find(p => p.userId.toString() === userProgress.userId.toString());
          if (!quizProgress) {
            quizProgress = {
              userId: userProgress.userId,
              completed: true,
              date: hardcodedCompletionDate,
              answers: []
            };
            content.quizProgress = content.quizProgress || [];
            content.quizProgress.push(quizProgress);
          } else {
            quizProgress.completed = true;
            quizProgress.date = hardcodedCompletionDate;
            quizProgress.answers = quizProgress.answers || [];
          }
          await content.save();
        } else if (task.type === 'video') {
          let watchProgress = content.watchProgress?.find(p => p.userId.toString() === userProgress.userId.toString());
          if (!watchProgress) {
            watchProgress = {
              userId: userProgress.userId,
              completed: true,
              completionDate: hardcodedCompletionDate,
            };
            content.watchProgress = content.watchProgress || [];
            content.watchProgress.push(watchProgress);
          } else {
            watchProgress.completed = true;
            watchProgress.completionDate = hardcodedCompletionDate;
          }
          await content.save();
        }
      }

      usersUpdated++;
      console.log('Assigned Silver status to None user:', {
        challengeId,
        userId: userProgress.userId,
        completionDate: userProgress.completionDate.toISOString(),
        status: userProgress.status
      });

      updatedUserProgress[i] = userProgress;
    }

    if (usersUpdated > 0) {
      await DailyChallenge.updateOne(
        { _id: challenge._id },
        { $set: { userProgress: updatedUserProgress } }
      );
    }

    const updatedChallenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId').lean();
    res.json({
      message: `Processed ${updatedUserProgress.length} users. Assigned Silver status to ${usersUpdated} users with None status.`,
      challenge: updatedChallenge
    });
  } catch (err) {
    console.error('Error in assignSilverToNoneUsers:', err);
    res.status(500).json({ error: err.message });
  }
};





// Assign Gold status to the first 52 non-Gold users for a specific challenge
exports.assignGoldToFirst52NonGoldUsers = async (req, res) => {
  try {
    const { challengeId } = req.body;

    // Validate challengeId
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ error: 'Invalid challengeId' });
    }

    // Fetch challenge with populated tasks.contentId
    const challenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId');
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const updatedUserProgress = [...challenge.userProgress];
    let usersUpdated = 0;

    // Process first 52 non-Gold users
    const usersToProcess = updatedUserProgress.slice(0, 120);
    for (let i = 0; i < usersToProcess.length; i++) {
      const userProgress = updatedUserProgress[i];
      if (userProgress.status === 'Gold' || userProgress.status === 'Silver') {
        continue; // Skip users who are already Gold
      }

      // Ensure completedTasks includes all tasks, mark them as completed
      userProgress.completedTasks = challenge.tasks.map(task => {
        const existingTask = userProgress.completedTasks.find(t => t.taskId.toString() === task._id.toString());
        return {
          taskId: task._id,
          completed: true,
          quizAnswers: existingTask?.quizAnswers || [],
          _id: existingTask?._id || new mongoose.Types.ObjectId()
        };
      });

      // Set Gold status requirements
      userProgress.completed = true;
      userProgress.status = 'Gold';
      userProgress.completionDate = new Date(challenge.createdAt); // Set to challenge createdAt for Gold status

      // Update quizProgress in content models for quiz tasks
      for (const task of challenge.tasks) {
        const Model = Models[task.model];
        if (!Model) {
          console.warn(`Model not found for task: ${task.model}`);
          continue;
        }

        const content = await Model.findById(task.contentId);
        if (!content) {
          console.warn(`Content not found for taskId: ${task._id}`);
          continue;
        }

        if (task.type === 'quiz') {
          let quizProgress = content.quizProgress?.find(p => p.userId.toString() === userProgress.userId.toString());
          if (!quizProgress) {
            // Create new quizProgress entry
            quizProgress = {
              userId: userProgress.userId,
              completed: true,
              date: new Date(challenge.createdAt),
              answers: []
            };
            content.quizProgress = content.quizProgress || [];
            content.quizProgress.push(quizProgress);
          } else {
            // Update existing quizProgress
            quizProgress.completed = true;
            quizProgress.date = new Date(challenge.createdAt);
            quizProgress.answers = quizProgress.answers || [];
          }
          await content.save();
        }
      }

      usersUpdated++;
      console.log('Assigned Gold status to non-Gold user:', {
        challengeId,
        userId: userProgress.userId,
        completionDate: userProgress.completionDate.toISOString(),
        status: userProgress.status
      });

      updatedUserProgress[i] = userProgress;
    }

    // Update the challenge with new userProgress
    if (usersUpdated > 0) {
      await DailyChallenge.updateOne(
        { _id: challenge._id },
        { $set: { userProgress: updatedUserProgress } }
      );
    }

    // Fetch updated challenge to return
    const updatedChallenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId').lean();
    res.json({
      message: `Processed ${usersToProcess.length} users. Assigned Gold status to ${usersUpdated} non-Gold users.`,
      challenge: updatedChallenge
    });
  } catch (err) {
    console.error('Error in assignGoldToFirst52NonGoldUsers:', err);
    res.status(500).json({ error: err.message });
  }
};


// Fix user progress for a specific challenge and user
exports.fixChallengeProgress = async (req, res) => {
  try {
    const { challengeId, userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(challengeId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid challengeId or userId' });
    }

    const challenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId');
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    let userProgress = challenge.userProgress.find((p) => p.userId.toString() === userId);
    if (!userProgress) {
      userProgress = { userId, completedTasks: [], completed: false, status: 'None' };
      challenge.userProgress.push(userProgress);
    }

    // Ensure all tasks have progress entries
    for (const task of challenge.tasks) {
      const Model = Models[task.model];
      if (!Model) continue;

      const content = await Model.findById(task.contentId);
      if (!content) continue;

      let taskProgress = userProgress.completedTasks.find((t) => t.taskId.toString() === task._id.toString());
      if (!taskProgress) {
        taskProgress = { taskId: task._id, completed: false };
        userProgress.completedTasks.push(taskProgress);
      }

      if (task.type === 'video') {
        const watch = content.watchProgress?.find((p) => p.userId.toString() === userId);
        taskProgress.completed = watch?.completed || false;
      } else if (task.type === 'quiz') {
        const quizProgress = content.quizProgress?.find((p) => p.userId.toString() === userId);
        taskProgress.completed = quizProgress?.completed || false;
      }
    }

    // Check if all tasks are completed
    userProgress.completed = userProgress.completedTasks.every((t) => t.completed);

    // Update completionDate and status
    if (userProgress.completed) {
      if (!userProgress.completionDate) {
        userProgress.completionDate = new Date();
      }
      const createdAtDate = new Date(challenge.createdAt);
      const completionDate = new Date(userProgress.completionDate);

      // Use UTC dates for comparison
      const createdAtUTC = new Date(Date.UTC(
        createdAtDate.getUTCFullYear(),
        createdAtDate.getUTCMonth(),
        createdAtDate.getUTCDate()
      ));
      const completionUTC = new Date(Date.UTC(
        completionDate.getUTCFullYear(),
        completionDate.getUTCMonth(),
        completionDate.getUTCDate()
      ));

      // Assign status: Gold if completed on the same UTC day, Silver otherwise
      userProgress.status = completionUTC.getTime() === createdAtUTC.getTime() ? 'Gold' : 'Silver';
    } else {
      userProgress.status = 'None';
      userProgress.completionDate = null; // Reset if incomplete
    }

    // Save updated userProgress
    await DailyChallenge.updateOne(
      { _id: challenge._id, 'userProgress.userId': userId },
      { $set: { 'userProgress.$': userProgress } }
    );

    // Fetch updated challenge to return
    const updatedChallenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId').lean();
    res.json({
      message: 'User progress updated successfully',
      challenge: updatedChallenge
    });
  } catch (err) {
    console.error('Error in fixChallengeProgress:', err);
    res.status(500).json({ error: err.message });
  }
};

// Fix progress for all users with completed tasks but incorrect status across all challenges
exports.fixAllChallengesProgress = async (req, res) => {
  try {
    const challenges = await DailyChallenge.find().populate('tasks.contentId');
    let totalUsersFixed = 0;
    let totalChallengesProcessed = 0;

    for (const challenge of challenges) {
      const updatedUserProgress = [...challenge.userProgress];
      let usersFixed = 0;

      // Process users with completed: false and status: "None"
      for (let i = 0; i < updatedUserProgress.length; i++) {
        const userProgress = updatedUserProgress[i];
        if (userProgress.completed || userProgress.status !== 'None') {
          continue; // Skip users who are already correctly marked
        }

        const completionDates = [];

        // Ensure all tasks have progress entries and check completion
        for (const task of challenge.tasks) {
          const Model = Models[task.model];
          if (!Model) continue;

          const content = await Model.findById(task.contentId);
          if (!content) continue;

          let taskProgress = userProgress.completedTasks.find((t) => t.taskId.toString() === task._id.toString());
          if (!taskProgress) {
            taskProgress = { taskId: task._id, completed: false, quizAnswers: [] };
            userProgress.completedTasks.push(taskProgress);
          }

          if (task.type === 'video') {
            const watch = content.watchProgress?.find((p) => p.userId.toString() === userProgress.userId.toString());
            taskProgress.completed = watch?.completed || false;
            if (watch?.completed && watch.date) {
              completionDates.push(new Date(watch.date));
            }
          } else if (task.type === 'quiz') {
            const quizProgress = content.quizProgress?.find((p) => p.userId.toString() === userProgress.userId.toString());
            taskProgress.completed = quizProgress?.completed || false;
            if (quizProgress?.completed && quizProgress.date) {
              completionDates.push(new Date(quizProgress.date));
            }
          }
        }

        // Check if all tasks are completed and all have completion dates
        const isCompleted = userProgress.completedTasks.every((t) => t.completed) && completionDates.length === challenge.tasks.length;

        if (isCompleted) {
          // Use the latest completion date
          const latestCompletionDate = new Date(Math.max(...completionDates));

          userProgress.completed = true;
          userProgress.completionDate = latestCompletionDate;

          const createdAtDate = new Date(challenge.createdAt);
          const createdAtUTC = new Date(Date.UTC(
            createdAtDate.getUTCFullYear(),
            createdAtDate.getUTCMonth(),
            createdAtDate.getUTCDate()
          ));
          const completionUTC = new Date(Date.UTC(
            latestCompletionDate.getUTCFullYear(),
            latestCompletionDate.getUTCMonth(),
            latestCompletionDate.getUTCDate()
          ));

          // Assign status: Gold if completed on the same UTC day, Silver otherwise
          userProgress.status = completionUTC.getTime() === createdAtUTC.getTime() ? 'Gold' : 'Silver';
          usersFixed++;

          console.log('Fixed user progress:', {
            challengeId: challenge._id,
            userId: userProgress.userId,
            completionDate: latestCompletionDate.toISOString(),
            status: userProgress.status,
            completedTasks: userProgress.completedTasks
          });
        } else {
          // Ensure status remains None for incomplete tasks or missing dates
          userProgress.completed = false;
          userProgress.status = 'None';
          userProgress.completionDate = null;
        }

        updatedUserProgress[i] = userProgress;
      }

      // Update the challenge if any users were fixed
      if (usersFixed > 0) {
        await DailyChallenge.updateOne(
          { _id: challenge._id },
          { $set: { userProgress: updatedUserProgress } }
        );
        totalUsersFixed += usersFixed;
        totalChallengesProcessed++;
      }
    }

    res.json({
      message: `Processed ${challenges.length} challenges. Fixed ${totalUsersFixed} users across ${totalChallengesProcessed} challenges.`,
      challengesProcessed: totalChallengesProcessed
    });
  } catch (err) {
    console.error('Error in fixAllChallengesProgress:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/daily-challenges/assign-gold-to-users
exports.assignGoldToUsersAcrossAllChallenges = async (req, res) => {
  try {
    const { userIds } = req.body; // Array of userIds to upgrade

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds must be a non-empty array' });
    }

    const challenges = await DailyChallenge.find().populate('tasks.contentId');
    let totalUpdates = 0;
    let updatedChallengeIds = [];

    for (const challenge of challenges) {
      let updated = false;

      for (let i = 0; i < challenge.userProgress.length; i++) {
        const progress = challenge.userProgress[i];

        if (
          userIds.includes(progress.userId.toString()) &&
          (progress.status === 'Silver' || progress.status === 'None')
        ) {
          // Set all tasks as completed
          progress.completedTasks = challenge.tasks.map(task => {
            const existingTask = progress.completedTasks.find(
              t => t.taskId.toString() === task._id.toString()
            );
            return {
              taskId: task._id,
              completed: true,
              quizAnswers: existingTask?.quizAnswers || [],
              _id: existingTask?._id || new mongoose.Types.ObjectId()
            };
          });

          progress.completed = true;
          progress.status = 'Gold';
          progress.completionDate = new Date(challenge.createdAt);

          // Update task content models
          for (const task of challenge.tasks) {
            const Model = Models[task.model];
            if (!Model) continue;
            const content = await Model.findById(task.contentId);
            if (!content) continue;

            const userIdStr = progress.userId.toString();

            if (task.type === 'quiz') {
              let quizProgress = content.quizProgress?.find(p => p.userId.toString() === userIdStr);
              if (!quizProgress) {
                content.quizProgress.push({
                  userId: progress.userId,
                  completed: true,
                  date: progress.completionDate,
                  answers: []
                });
              } else {
                quizProgress.completed = true;
                quizProgress.date = progress.completionDate;
              }
            }

            if (task.type === 'video') {
              let watchProgress = content.watchProgress?.find(p => p.userId.toString() === userIdStr);
              if (!watchProgress) {
                content.watchProgress.push({
                  userId: progress.userId,
                  completed: true,
                  completionDate: progress.completionDate
                });
              } else {
                watchProgress.completed = true;
                watchProgress.completionDate = progress.completionDate;
              }
            }

            await content.save();
          }

          challenge.userProgress[i] = progress;
          updated = true;
          totalUpdates++;
        }
      }

      if (updated) {
        await challenge.save();
        updatedChallengeIds.push(challenge._id);
      }
    }

    res.json({
      message: `Successfully upgraded ${totalUpdates} entries to Gold across ${updatedChallengeIds.length} challenges.`,
      updatedChallenges: updatedChallengeIds,
    });
  } catch (err) {
    console.error('Error assigning Gold:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// Migrate users with None status to Gold or Silver for a specific challenge
exports.migrateUsersToStatus = async (req, res) => {
  try {
    const { challengeId, migrations } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ error: 'Invalid challengeId' });
    }
    if (!Array.isArray(migrations) || migrations.length === 0) {
      return res.status(400).json({ error: 'Migrations array is required and must not be empty' });
    }
    for (const migration of migrations) {
      if (!mongoose.Types.ObjectId.isValid(migration.userId)) {
        return res.status(400).json({ error: `Invalid userId: ${migration.userId}` });
      }
      if (!['Gold', 'Silver'].includes(migration.targetStatus)) {
        return res.status(400).json({ error: `Invalid targetStatus: ${migration.targetStatus}` });
      }
    }

    // Fetch challenge
    const challenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId');
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    let usersUpdated = 0;
    const updatedUserProgress = [...challenge.userProgress];

    // Process migrations
    for (const migration of migrations) {
      const { userId, targetStatus } = migration;
      const userProgressIndex = updatedUserProgress.findIndex(
        (p) => p.userId.toString() === userId.toString()
      );

      // Validate user progress
      if (userProgressIndex === -1) {
        return res.status(400).json({ error: `User ${userId} not found in challenge progress` });
      }
      const userProgress = updatedUserProgress[userProgressIndex];
      if (userProgress.status !== 'None') {
        return res.status(400).json({ error: `User ${userId} is not in None status (current: ${userProgress.status})` });
      }

      // Update userProgress
      userProgress.completedTasks = challenge.tasks.map(task => ({
        taskId: task._id,
        completed: true,
        quizAnswers: [],
        _id: new mongoose.Types.ObjectId()
      }));
      userProgress.completed = true;
      userProgress.status = targetStatus;
      userProgress.completionDate = targetStatus === 'Gold'
        ? new Date(challenge.createdAt)
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day for Silver to ensure different UTC day

      // Update content models
      for (const task of challenge.tasks) {
        const Model = Models[task.model];
        if (!Model) {
          return res.status(400).json({ error: `Model not found for task: ${task.model}` });
        }
        const content = await Model.findById(task.contentId);
        if (!content) {
          return res.status(404).json({ error: `Content not found for task ${task._id}` });
        }

        if (task.type === 'video') {
          content.watchProgress = content.watchProgress || [];
          let watchProgress = content.watchProgress.find(p => p.userId.toString() === userId.toString());
          if (!watchProgress) {
            content.watchProgress.push({
              userId,
              completed: true,
              completionDate: userProgress.completionDate
            });
          } else {
            watchProgress.completed = true;
            watchProgress.completionDate = userProgress.completionDate;
          }
          await content.save();
        } else if (task.type === 'quiz') {
          content.quizProgress = content.quizProgress || [];
          let quizProgress = content.quizProgress.find(p => p.userId.toString() === userId.toString());
          if (!quizProgress) {
            content.quizProgress.push({
              userId,
              completed: true,
              date: userProgress.completionDate,
              answers: []
            });
          } else {
            quizProgress.completed = true;
            quizProgress.date = userProgress.completionDate;
            quizProgress.answers = quizProgress.answers || [];
          }
          await content.save();
        }
      }

      updatedUserProgress[userProgressIndex] = userProgress;
      usersUpdated++;
    }

    // Save updated challenge
    if (usersUpdated > 0) {
      await DailyChallenge.updateOne(
        { _id: challenge._id },
        { $set: { userProgress: updatedUserProgress } }
      );
    }

    // Fetch updated challenge
    const updatedChallenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId').lean();
    res.json({
      message: `Migrated ${usersUpdated} users to specified statuses`,
      challenge: updatedChallenge
    });
  } catch (err) {
    console.error('Error in migrateUsersToStatus:', err);
    res.status(500).json({ error: err.message });
  }
};


// // Migrate users from Silver to Gold for a specific challenge
// exports.migrateUsersToStatus = async (req, res) => {
//   try {
//     const { challengeId, migrations } = req.body;

//     // Validate inputs
//     if (!mongoose.Types.ObjectId.isValid(challengeId)) {
//       return res.status(400).json({ error: 'Invalid challengeId' });
//     }
//     if (!Array.isArray(migrations) || migrations.length === 0) {
//       return res.status(400).json({ error: 'Migrations array is required and must not be empty' });
//     }
//     for (const migration of migrations) {
//       if (!mongoose.Types.ObjectId.isValid(migration.userId)) {
//         return res.status(400).json({ error: `Invalid userId: ${migration.userId}` });
//       }
//       if (migration.targetStatus !== 'Gold') {
//         return res.status(400).json({ error: `Invalid targetStatus: ${migration.targetStatus}. Only Gold is allowed` });
//       }
//     }

//     // Fetch challenge
//     const challenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId');
//     if (!challenge) {
//       return res.status(404).json({ error: 'Challenge not found' });
//     }

//     let usersUpdated = 0;
//     const updatedUserProgress = [...challenge.userProgress];

//     // Process migrations
//     for (const migration of migrations) {
//       const { userId, targetStatus } = migration;
//       const userProgressIndex = updatedUserProgress.findIndex(
//         (p) => p.userId.toString() === userId.toString()
//       );

//       // Validate user progress
//       if (userProgressIndex === -1) {
//         return res.status(400).json({ error: `User ${userId} not found in challenge progress` });
//       }
//       const userProgress = updatedUserProgress[userProgressIndex];
//       if (userProgress.status !== 'Silver') {
//         return res.status(400).json({ error: `User ${userId} is not in Silver status (current: ${userProgress.status})` });
//       }

//       // Update userProgress
//       userProgress.completedTasks = challenge.tasks.map(task => {
//         const existingTask = userProgress.completedTasks.find(t => t.taskId.toString() === task._id.toString());
//         return {
//           taskId: task._id,
//           completed: true,
//           quizAnswers: existingTask?.quizAnswers || [],
//           _id: existingTask?._id || new mongoose.Types.ObjectId()
//         };
//       });
//       userProgress.completed = true;
//       userProgress.status = targetStatus;
//       userProgress.completionDate = new Date(challenge.createdAt); // Set to createdAt for Gold

//       // Update content models
//       for (const task of challenge.tasks) {
//         const Model = Models[task.model];
//         if (!Model) {
//           return res.status(400).json({ error: `Model not found for task: ${task.model}` });
//         }
//         const content = await Model.findById(task.contentId);
//         if (!content) {
//           return res.status(404).json({ error: `Content not found for task ${task._id}` });
//         }

//         if (task.type === 'video') {
//           content.watchProgress = content.watchProgress || [];
//           let watchProgress = content.watchProgress.find(p => p.userId.toString() === userId.toString());
//           if (!watchProgress) {
//             content.watchProgress.push({
//               userId,
//               completed: true,
//               completionDate: userProgress.completionDate
//             });
//           } else {
//             watchProgress.completed = true;
//             watchProgress.completionDate = userProgress.completionDate;
//           }
//           await content.save();
//         } else if (task.type === 'quiz') {
//           content.quizProgress = content.quizProgress || [];
//           let quizProgress = content.quizProgress.find(p => p.userId.toString() === userId.toString());
//           if (!quizProgress) {
//             content.quizProgress.push({
//               userId,
//               completed: true,
//               date: userProgress.completionDate,
//               answers: []
//             });
//           } else {
//             quizProgress.completed = true;
//             quizProgress.date = userProgress.completionDate;
//             quizProgress.answers = quizProgress.answers || [];
//           }
//           await content.save();
//         }
//       }

//       updatedUserProgress[userProgressIndex] = userProgress;
//       usersUpdated++;
//     }

//     // Save updated challenge
//     if (usersUpdated > 0) {
//       await DailyChallenge.updateOne(
//         { _id: challenge._id },
//         { $set: { userProgress: updatedUserProgress } }
//       );
//     }

//     // Fetch updated challenge
//     const updatedChallenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId').lean();
//     res.json({
//       message: `Migrated ${usersUpdated} users to Gold status`,
//       challenge: updatedChallenge
//     });
//   } catch (err) {
//     console.error('Error in migrateUsersToStatus:', err);
//     res.status(500).json({ error: err.message });
//   }
// };
// // Get all challenges for a specific user, including those not started
// exports.getChallengeHistory = async (req, res) => {
//   try {
//     const { userId } = req.query;

//     // Validate userId
//     if (!userId || !mongoose.isValidObjectId(userId)) {
//       return res.status(400).json({ error: 'Valid userId is required' });
//     }

//     // Fetch all challenges
//     const challenges = await DailyChallenge.find({})
//       .sort({ date: -1 })
//       .lean();

//     // Populate tasks.contentId and add synthetic userProgress
//     const history = await Promise.all(challenges.map(async (challenge) => {
//       // Populate tasks.contentId
//       for (const task of challenge.tasks) {
//         const Model = Models[task.model];
//         if (Model) {
//           try {
//             task.contentId = await Model.findById(task.contentId).lean();
//           } catch (err) {
//             console.warn(`Failed to populate contentId ${task.contentId} for model ${task.model}:`, err.message);
//             task.contentId = null; // Handle missing content gracefully
//           }
//         } else {
//           console.warn(`Model not found for task: ${task.model}`);
//           task.contentId = null;
//         }
//       }

//       // Add synthetic userProgress if user is not in userProgress
//       const userProgress = challenge.userProgress || [];
//       if (!userProgress.some(p => p.userId.toString() === userId)) {
//         userProgress.push({
//           userId: new mongoose.Types.ObjectId(userId),
//           completed: false,
//           status: 'None',
//           completedTasks: challenge.tasks.map(task => ({
//             taskId: task._id,
//             completed: false
//           })),
//           completionDate: null
//         });
//       }

//       return {
//         ...challenge,
//         userProgress
//       };
//     }));

//     res.json(history);
//   } catch (err) {
//     console.error('Error in getChallengeHistory:', err);
//     res.status(500).json({ error: err.message });
//   }
// };



// // Get daily challenge for a specific date
// exports.getDailyChallenge = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: 'userId is required' });

//     const challenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
//     if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

//     const mutableChallenge = { ...challenge };
//     let userProgress = mutableChallenge.userProgress.find((p) => p.userId.toString() === userId);

//     if (!userProgress) {
//       userProgress = { userId, completedTasks: [], completed: false, status: 'None' };
//       await DailyChallenge.updateOne(
//         { _id: challenge._id },
//         { $push: { userProgress } }
//       );
//     }

//     for (const task of mutableChallenge.tasks) {
//       const Model = Models[task.model];
//       if (!Model) continue;

//       const content = await Model.findById(task.contentId);
//       if (!content) continue;

//       let taskProgress = userProgress.completedTasks.find((t) => t.taskId.toString() === task._id.toString());
//       if (!taskProgress) {
//         taskProgress = { taskId: task._id, completed: false };
//         userProgress.completedTasks.push(taskProgress);
//       }

//       if (task.type === 'video') {
//         const watch = content.watchProgress?.find((p) => p.userId.toString() === userId);
//         taskProgress.completed = watch?.completed || false;
//       }
//     }

//     userProgress.completed = userProgress.completedTasks.every((t) => t.completed);
//     if (userProgress.completed && !userProgress.completionDate) {
//       userProgress.completionDate = new Date();
//       const createdAtDate = new Date(challenge.createdAt);
//       const completionDate = new Date(userProgress.completionDate);

//       // Normalize dates to midnight for comparison
//       const createdAtMidnight = new Date(createdAtDate.setHours(0, 0, 0, 0));
//       const completionMidnight = new Date(completionDate.setHours(0, 0, 0, 0));

//       // Set status based on completion date relative to createdAt date
//       userProgress.status =
//         completionMidnight.getTime() === createdAtMidnight.getTime()
//           ? 'Gold'
//           : 'Silver';
//     } else if (!userProgress.completed) {
//       userProgress.status = 'None';
//     }

//     await DailyChallenge.updateOne(
//       { _id: mutableChallenge._id, 'userProgress.userId': userId },
//       { $set: { 'userProgress.$': userProgress } }
//     );

//     const updatedChallenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
//     res.json(updatedChallenge);
//   } catch (err) {
//     console.error('Error in getDailyChallenge:', err);
//     res.status(500).json({ error: err.message });
//   }
// };


// exports.getDailyChallenge = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: 'userId is required' });

//     const challenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
//     if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

//     const mutableChallenge = { ...challenge };
//     let userProgress = mutableChallenge.userProgress.find((p) => p.userId.toString() === userId);

//     if (!userProgress) {
//       userProgress = { userId, completedTasks: [], completed: false, status: 'None' };
//       await DailyChallenge.updateOne(
//         { _id: challenge._id },
//         { $push: { userProgress } }
//       );
//     }

//     for (const task of mutableChallenge.tasks) {
//       const Model = Models[task.model];
//       if (!Model) continue;

//       const content = await Model.findById(task.contentId);
//       if (!content) continue;

//       let taskProgress = userProgress.completedTasks.find((t) => t.taskId.toString() === task._id.toString());
//       if (!taskProgress) {
//         taskProgress = { taskId: task._id, completed: false };
//         userProgress.completedTasks.push(taskProgress);
//       }

//       if (task.type === 'video') {
//         const watch = content.watchProgress?.find((p) => p.userId.toString() === userId);
//         taskProgress.completed = watch?.completed || false;
//       }
//     }

//     userProgress.completed = userProgress.completedTasks.every((t) => t.completed);
//     if (userProgress.completed && !userProgress.completionDate) {
//       userProgress.completionDate = new Date();
//       const challengeDate = new Date(challenge.date);
//       const completionDate = new Date(userProgress.completionDate);

//       // Set challenge date to 12:00 AM
//       const challengeStart = new Date(challengeDate.setHours(0, 0, 0, 0));
//       // Set challenge date to 11:00 PM
//       const challengeEnd = new Date(challengeDate.setHours(23, 0, 0, 0));

//       // Check if completion is within 12:00 AM - 11:00 PM on challenge date
//       userProgress.status =
//         completionDate >= challengeStart && completionDate <= challengeEnd
//           ? 'Gold'
//           : 'Silver';
//     } else if (!userProgress.completed) {
//       userProgress.status = 'None';
//     }

//     await DailyChallenge.updateOne(
//       { _id: mutableChallenge._id, 'userProgress.userId': userId },
//       { $set: { 'userProgress.$': userProgress } }
//     );

//     const updatedChallenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
//     res.json(updatedChallenge);
//   } catch (err) {
//     console.error('Error in getDailyChallenge:', err);
//     res.status(500).json({ error: err.message });
//   }
// };


// // Get all completed challenges for a specific user
// exports.getChallengeHistory = async (req, res) => {
//   try {
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: 'userId is required' });

//     const history = await DailyChallenge.find({ 'userProgress.userId': userId })
//       .populate('tasks.contentId')
//       .sort({ date: -1 })
//       .lean();

//     res.json(history);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Get all challenges where all tasks are completed for a specific user
// exports.getCompletedChallenges = async (req, res) => {
//   try {
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: 'userId is required' });

//     const completedChallenges = await DailyChallenge.find({
//       'userProgress.userId': userId,
//       'userProgress.completed': true,
//     })
//       .populate('tasks.contentId')
//       .sort({ date: -1 })
//       .lean();

//     res.json(completedChallenges);
//   } catch (err) {
//     console.error('Error in getCompletedChallenges:', err);
//     res.status(500).json({ error: err.message });
//   }
// };

// Submit a quiz for a task
exports.submitQuiz = async (req, res) => {
  try {
    const { challengeId, taskId, answers, userId } = req.body;

    const challenge = await DailyChallenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const task = challenge.tasks.find(t => t._id.toString() === taskId);
    if (!task || task.type !== 'quiz') {
      return res.status(400).json({ error: 'Invalid quiz task' });
    }

    const Model = Models[task.model];
    const content = await Model.findById(task.contentId);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    const quizProgress = {
      userId,
      answers: [],
      completed: false,
      score: 0,
    };

    for (const answer of answers) {
      const question = content.quiz.find(q => q._id.toString() === answer.questionId);
      if (!question) return res.status(400).json({ error: 'Invalid question' });

      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      quizProgress.answers.push({
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
      });

      if (isCorrect) quizProgress.score++;
    }

    quizProgress.completed = true;
    content.quizProgress.push(quizProgress);
    await content.save();

    await updateDailyChallengeProgress({ userId, challengeId, taskId });
    res.json({ quizProgress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update progress for a specific task
const updateDailyChallengeProgress = async ({ userId, challengeId, taskId }) => {
  const challenge = await DailyChallenge.findById(challengeId);
  if (!challenge) throw new Error('Challenge not found');

  const task = challenge.tasks.find(t => t._id.toString() === taskId);
  if (!task) throw new Error('Task not found');

  const Model = Models[task.model];
  if (!Model) throw new Error('Invalid model');

  const content = await Model.findById(task.contentId);
  if (!content) throw new Error('Content not found');

  const { completed, quizAnswers } = await evaluateTaskProgress(userId, task, content);

  let userProgress = challenge.userProgress.find(p => p.userId.toString() === userId);
  if (!userProgress) {
    userProgress = { userId, completedTasks: [], completed: false };
    challenge.userProgress.push(userProgress);
  }

  let taskProgress = userProgress.completedTasks.find(t => t.taskId.toString() === taskId);
  if (!taskProgress) {
    taskProgress = { taskId, completed: false };
    userProgress.completedTasks.push(taskProgress);
  }

  taskProgress.completed = completed;
  if (task.type === 'quiz') taskProgress.quizAnswers = quizAnswers;

  userProgress.completed = userProgress.completedTasks.every(t => t.completed);
  if (userProgress.completed && !userProgress.completionDate) {
    userProgress.completionDate = new Date();
  }

  await challenge.save();
};

// Utility function to evaluate task progress
const evaluateTaskProgress = async (userId, task, content) => {
  let completed = false;
  let quizAnswers = [];

  if (task.type === 'video') {
    const progress = content.watchProgress?.find(p => p.userId.toString() === userId);
    completed = progress?.completed || false;
  } else if (task.type === 'quiz') {
    const progress = content.quizProgress?.find(p => p.userId.toString() === userId);
    completed = progress?.completed || false;
    quizAnswers = progress?.answers || [];
  }

  return { completed, quizAnswers };
};


// Get all completed challenges for a specific user
exports.getCompletedChallenges = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const completedChallenges = await DailyChallenge.find({
      'userProgress.userId': userId,
      'userProgress.completed': true,
    })
      .populate('tasks.contentId')
      .sort({ date: -1 })
      .lean();

    res.json(completedChallenges);
  } catch (err) {
    console.error('Error in getCompletedChallenges:', err);
    res.status(500).json({ error: err.message });
  }
};




// Set status to Gold for users with at least one completed task
exports.setAllCompletedTasksGold = async (req, res) => {
  try {
    const { challengeId } = req.params;

    if (!mongoose.isValidObjectId(challengeId)) {
      return res.status(400).json({ error: `Invalid challengeId: ${challengeId}` });
    }

    const challenge = await DailyChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: `DailyChallenge not found for ID: ${challengeId}` });
    }

    let updatedCount = 0;
    for (let userProgress of challenge.userProgress) {
      const hasCompletedTask = userProgress.completedTasks.some((task) => task.completed);
      if (hasCompletedTask) {
        userProgress.status = 'Gold';
        if (!userProgress.completionDate) {
          userProgress.completionDate = new Date();
        }
        updatedCount++;
        console.log(`Updated userProgress to Gold for user: ${userProgress.userId}`);
      }
    }

    await challenge.save();
    console.log(`Updated ${updatedCount} userProgress entries to Gold status for challenge: ${challengeId}`);

    res.status(200).json({
      message: `Updated ${updatedCount} users to Gold status`,
      challenge,
    });
  } catch (error) {
    console.error('Error in setAllCompletedTasksGold:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};



// In controllers/dailyChallengeController.js

// Update video progress for a task
exports.updateVideoProgress = async (req, res) => {
  try {
    const { userId, challengeId, taskId, activeWatchDuration, totalDuration } = req.body;

    // Validate input
    if (!userId || !challengeId || !taskId || activeWatchDuration === undefined || totalDuration === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check for duration error
    if (activeWatchDuration > totalDuration) {
      return res.status(400).json({ error: "Active watch duration cannot exceed total duration" });
    }

    // Find the challenge
    const challenge = await DailyChallenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ error: "Challenge not found" });

    // Find the task
    const task = challenge.tasks.find((t) => t._id.toString() === taskId);
    if (!task || task.type !== "video") {
      return res.status(400).json({ error: "Invalid video task" });
    }

    // Get the content model
    const Model = Models[task.model];
    if (!Model) return res.status(400).json({ error: `Invalid model: ${task.model}` });

    // Update watch progress in the content model
    const content = await Model.findById(task.contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });

    let watchProgress = content.watchProgress.find((p) => p.userId.toString() === userId);
    if (!watchProgress) {
      watchProgress = { userId, activeWatchDuration, totalDuration, completed: false };
      content.watchProgress.push(watchProgress);
    } else {
      watchProgress.activeWatchDuration = activeWatchDuration;
      watchProgress.totalDuration = totalDuration;
    }

    // Mark video as completed if watched sufficiently (e.g., 90% of total duration)
    watchProgress.completed = activeWatchDuration >= totalDuration * 0.98;
    await content.save();

    // Update userProgress in DailyChallenge
    let userProgress = challenge.userProgress.find((p) => p.userId.toString() === userId);
    if (!userProgress) {
      userProgress = { userId, completedTasks: [], completed: false, status: "None" };
      challenge.userProgress.push(userProgress);
    }

    let taskProgress = userProgress.completedTasks.find((t) => t.taskId.toString() === taskId);
    if (!taskProgress) {
      taskProgress = { taskId, completed: false };
      userProgress.completedTasks.push(taskProgress);
    }

    taskProgress.completed = watchProgress.completed;

    // Update challenge completion and status
    userProgress.completed = userProgress.completedTasks.every((t) => t.completed);
    if (userProgress.completed && !userProgress.completionDate) {
      userProgress.completionDate = new Date();
      const challengeDate = new Date(challenge.date).toISOString().split("T")[0];
      const completionDate = userProgress.completionDate.toISOString().split("T")[0];
      userProgress.status = completionDate === challengeDate ? "Gold" : "Silver";
    } else if (!userProgress.completed) {
      userProgress.status = "None";
    }

    await challenge.save();

    res.json({ message: "Video progress updated", userProgress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// In controllers/dailyChallengeController.js

exports.checkDailyChallengeTask = async (req, res) => {
  try {
    const { contentId, model } = req.query;

    if (!contentId || !model) {
      return res.status(400).json({ error: 'contentId and model are required' });
    }

    // Find today's challenge (or any challenge with the task)
    const challenge = await DailyChallenge.findOne({
      'tasks.contentId': contentId,
      'tasks.model': model,
      'tasks.type': 'video', // Ensure it's a video task
    });

    res.json({
      isDailyChallengeTask: !!challenge, // true if found, false if not
    });
  } catch (err) {
    console.error('Error in checkDailyChallengeTask:', err);
    res.status(500).json({ error: err.message });
  }
};








// // In controllers/dailyChallengeController.js
// exports.getDailyChallenge = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: 'userId is required' });

//     const challenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
//     if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

//     const mutableChallenge = { ...challenge };
//     let userProgress = mutableChallenge.userProgress.find((p) => p.userId.toString() === userId);

//     if (!userProgress) {
//       userProgress = { userId, completedTasks: [], completed: false, status: 'None' };
//       await DailyChallenge.updateOne(
//         { _id: challenge._id },
//         { $push: { userProgress } }
//       );
//     }

//     for (const task of mutableChallenge.tasks) {
//       const Model = Models[task.model];
//       if (!Model) continue;

//       const content = await Model.findById(task.contentId);
//       if (!content) continue;

//       let taskProgress = userProgress.completedTasks.find((t) => t.taskId.toString() === task._id.toString());
//       if (!taskProgress) {
//         taskProgress = { taskId: task._id, completed: false };
//         userProgress.completedTasks.push(taskProgress);
//       }

//       if (task.type === 'video') {
//         const watch = content.watchProgress?.find((p) => p.userId.toString() === userId);
//         taskProgress.completed = watch?.completed || false;
//       }
//     }

//     userProgress.completed = userProgress.completedTasks.every((t) => t.completed);
//     if (userProgress.completed && !userProgress.completionDate) {
//       userProgress.completionDate = new Date();
//       const challengeDate = new Date(challenge.date).toISOString().split('T')[0];
//       const completionDate = userProgress

// .completionDate.toISOString().split('T')[0];
//       userProgress.status = completionDate === challengeDate ? 'Gold' : 'Silver';
//     } else if (!userProgress.completed) {
//       userProgress.status = 'None';
//     }

//     await DailyChallenge.updateOne(
//       { _id: mutableChallenge._id, 'userProgress.userId': userId },
//       { $set: { 'userProgress.$': userProgress } }
//     );

//     const updatedChallenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId');
//     res.json(updatedChallenge);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Fix progress for all users in a specific challenge
// exports.fixAllUsersChallengeProgress = async (req, res) => {
//   try {
//     const { challengeId } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(challengeId)) {
//       return res.status(400).json({ error: 'Invalid challengeId' });
//     }

//     const challenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId');
//     if (!challenge) {
//       return res.status(404).json({ error: 'Challenge not found' });
//     }

//     const updatedUserProgress = [];
//     let inconsistenciesFound = 0;

//     // Process each user's progress
//     for (let userProgress of challenge.userProgress) {
//       // Ensure all tasks have progress entries
//       for (const task of challenge.tasks) {
//         const Model = Models[task.model];
//         if (!Model) continue;

//         const content = await Model.findById(task.contentId);
//         if (!content) continue;

//         let taskProgress = userProgress.completedTasks.find((t) => t.taskId.toString() === task._id.toString());
//         if (!taskProgress) {
//           taskProgress = { taskId: task._id, completed: false };
//           userProgress.completedTasks.push(taskProgress);
//         }

//         if (task.type === 'video') {
//           const watch = content.watchProgress?.find((p) => p.userId.toString() === userProgress.userId.toString());
//           taskProgress.completed = watch?.completed || false;
//         } else if (task.type === 'quiz') {
//           const quizProgress = content.quizProgress?.find((p) => p.userId.toString() === userProgress.userId.toString());
//           taskProgress.completed = quizProgress?.completed || false;
//         }
//       }

//       // Check if all tasks are completed
//       const isCompleted = userProgress.completedTasks.every((t) => t.completed);

//       // Log inconsistency if completed is true but not all tasks are completed
//       if (userProgress.completed && !isCompleted) {
//         console.warn('Inconsistency detected:', {
//           challengeId,
//           userId: userProgress.userId,
//           completedTasks: userProgress.completedTasks,
//           status: userProgress.status
//         });
//         inconsistenciesFound++;
//       }

//       userProgress.completed = isCompleted;

//       // Update completionDate and status
//       if (isCompleted) {
//         if (!userProgress.completionDate) {
//           userProgress.completionDate = new Date();
//         }
//         const createdAtDate = new Date(challenge.createdAt);
//         const completionDate = new Date(userProgress.completionDate);

//         // Use UTC dates for comparison
//         const createdAtUTC = new Date(Date.UTC(
//           createdAtDate.getUTCFullYear(),
//           createdAtDate.getUTCMonth(),
//           createdAtDate.getUTCDate()
//         ));
//         const completionUTC = new Date(Date.UTC(
//           completionDate.getUTCFullYear(),
//           completionDate.getUTCMonth(),
//           completionDate.getUTCDate()
//         ));

//         // Assign status: Gold if completed on the same UTC day, Silver otherwise
//         userProgress.status = completionUTC.getTime() === createdAtUTC.getTime() ? 'Gold' : 'Silver';
//       } else {
//         userProgress.status = 'None';
//         userProgress.completionDate = null; // Reset if incomplete
//       }

//       updatedUserProgress.push(userProgress);
//     }

//     // Update the entire userProgress array
//     await DailyChallenge.updateOne(
//       { _id: challenge._id },
//       { $set: { userProgress: updatedUserProgress } }
//     );

//     // Fetch updated challenge to return
//     const updatedChallenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId').lean();
//     res.json({
//       message: `Progress updated for all ${updatedUserProgress.length} users. Inconsistencies found: ${inconsistenciesFound}`,
//       challenge: updatedChallenge
//     });
//   } catch (err) {
//     console.error('Error in fixAllUsersChallengeProgress:', err);
//     res.status(500).json({ error: err.message });
//   }
// };

















// // Get daily challenge for a specific user and date
// exports.getDailyChallenge = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: 'userId is required' });

//     const challenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
//     if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

//     const mutableChallenge = { ...challenge };
//     let userProgress = mutableChallenge.userProgress.find(p => p.userId.toString() === userId);

//     if (!userProgress) {
//       userProgress = { userId, completedTasks: [], completed: false };
//       await DailyChallenge.updateOne(
//         { _id: challenge._id },
//         { $push: { userProgress } }
//       );
//     }

//     for (const task of mutableChallenge.tasks) {
//       const Model = Models[task.model];
//       if (!Model) continue;

//       const content = await Model.findById(task.contentId);
//       if (!content) continue;

//       let taskProgress = userProgress.completedTasks.find(t => t.taskId.toString() === task._id.toString());
//       if (!taskProgress) {
//         taskProgress = { taskId: task._id, completed: false };
//         userProgress.completedTasks.push(taskProgress);
//       }

//       if (task.type === 'video') {
//         const watch = content.watchProgress?.find(p => p.userId.toString() === userId);
//         taskProgress.completed = watch?.completed || false;
//       } 
//       // else if (task.type === 'quiz') {
//       //   const quiz = content.quizProgress?.find(p => p.userId.toString() === userId);
//       //   taskProgress.completed = quiz?.completed || false;
//       //   taskProgress.quizAnswers = quiz?.answers || [];
//       // }
//     }

//     userProgress.completed = userProgress.completedTasks.every(t => t.completed);
//     if (userProgress.completed && !userProgress.completionDate) {
//       userProgress.completionDate = new Date();
//     }

//     await DailyChallenge.updateOne(
//       { _id: mutableChallenge._id, 'userProgress.userId': userId },
//       { $set: { 'userProgress.$': userProgress } }
//     );

//     const updatedChallenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId');
//     res.json(updatedChallenge);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



// // Assign Gold status to all non-Gold users for a specific challenge
// exports.assignGoldStatusToAll = async (req, res) => {
//   try {
//     const { challengeId } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(challengeId)) {
//       return res.status(400).json({ error: 'Invalid challengeId' });
//     }

//     const challenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId');
//     if (!challenge) {
//       return res.status(404).json({ error: 'Challenge not found' });
//     }

//     const updatedUserProgress = [...challenge.userProgress];
//     let usersUpdated = 0;

//     // Process users who are not on Gold status
//     for (let i = 0; i < updatedUserProgress.length; i++) {
//       const userProgress = updatedUserProgress[i];
//       if (userProgress.status === 'Gold') {
//         continue; // Skip users already on Gold
//       }

//       // Update completedTasks to mark all tasks as completed
//       userProgress.completedTasks = challenge.tasks.map(task => ({
//         taskId: task._id,
//         completed: true,
//         quizAnswers: []
//       }));

//       // Set Gold status requirements
//       userProgress.completed = true;
//       userProgress.status = 'Gold';
//       userProgress.completionDate = new Date(challenge.date); // Set to challenge date start (2025-05-02T00:00:00.000Z)

//       // Update watchProgress in content models
//       for (const task of challenge.tasks) {
//         const Model = Models[task.model];
//         if (!Model) continue;

//         const content = await Model.findById(task.contentId);
//         if (!content) continue;

//         if (task.type === 'video') {
//           let watch = content.watchProgress?.find(p => p.userId.toString() === userProgress.userId.toString());
//           if (!watch) {
//             // Create new watchProgress entry
//             watch = {
//               userId: userProgress.userId,
//               name: userProgress.name || 'Unknown', // Adjust based on your user data
//               department: userProgress.department || 'Unknown',
//               watchedPercentage: 100,
//               completed: true,
//               activeWatchDuration: 1000, // Default value, adjust as needed
//               totalDuration: 1000, // Default value, adjust as needed
//               date: new Date(challenge.date)
//             };
//             content.watchProgress.push(watch);
//           } else {
//             // Update existing watchProgress
//             watch.completed = true;
//             watch.watchedPercentage = 100;
//             watch.date = new Date(challenge.date);
//             watch.activeWatchDuration = watch.totalDuration || 1000; // Preserve or set default
//           }
//           await content.save();
//         }
//         // Note: No quiz tasks in this challenge, but endpoint supports quizzes if needed
//       }

//       usersUpdated++;
//       console.log('Assigned Gold status:', {
//         challengeId,
//         userId: userProgress.userId,
//         completionDate: userProgress.completionDate.toISOString(),
//         status: userProgress.status
//       });

//       updatedUserProgress[i] = userProgress;
//     }

//     // Update the challenge with new userProgress
//     if (usersUpdated > 0) {
//       await DailyChallenge.updateOne(
//         { _id: challenge._id },
//         { $set: { userProgress: updatedUserProgress } }
//       );
//     }

//     // Fetch updated challenge to return
//     const updatedChallenge = await DailyChallenge.findById(challengeId).populate('tasks.contentId').lean();
//     res.json({
//       message: `Processed ${updatedUserProgress.length} users. Assigned Gold status to ${usersUpdated} users.`,
//       challenge: updatedChallenge
//     });
//   } catch (err) {
//     console.error('Error in assignGoldStatusToAll:', err);
//     res.status(500).json({ error: err.message });
//   }
// };


// Get users with Silver or None status for a specific challenge, including user information




















//SPECIAL LOGIC FOR USER THAT UPGRADED

// const mongoose = require('mongoose');

// const DailyChallenge = require('../models/DailyChallenge');
// const Classroom = require('../models/classroom');
// const Cecbs = require('../models/cecbs');
// const Classics = require('../models/classics');
// const Plenary = require('../models/plenary');
// const OnDjob = require('../models/OnDjob');
// const ExcellenceSeriesHF = require('../models/excellenceSeriesHF');
// const User = require('../models/lsdc');
// const ExcelAns4u = require('../models/excelAns4u');
// const Bltse = require('../models/bltse'); // Fixed: Correct model name
// const ExcelStaffSeries = require('../models/excelStafSeries');
// const SpotlightAward = require('../models/spotlightAward');
// const SpotlightOnEx = require('../models/spotlightOnEx');
// const FaithProclaim = require('../models/faithproclaim');
// const GoalSettting = require('../models/goalSetttings');
// const LoveStaffCulture = require('../models/loveCulture');
// const HealthCare = require('../models/healthcare');
// const MessageExcerpt = require('../models/messageExcerpt');
// const LearningChallenge = require('../models/learningChallenge');
// const Promo = require('../models/promo');
// const SpotOnExMain = require('../models/spotOnexMain');
// const Supersession = require('../models/supersession');

// const Models = {
//   Classroom,
//   Cecbs,
//   Classics,
//   Plenary,
//   OnDjob,
//   ExcellenceSeriesHF,
//   ExcelAns4u,
//   Bltse, // Fixed: Correct key
//   ExcelStaffSeries,
//   SpotlightAward,
//   SpotlightOnEx,
//   GoalSettting,
//   LoveStaffCulture,
//   HealthCare,
//   MessageExcerpt,
//   LearningChallenge,
//   Promo,
//   SpotOnExMain,
//   FaithProclaim,
//   Supersession,
// };

// // Create a new daily challenge
// exports.createDailyChallenge = async (req, res) => {
//   try {
//     const { date, tasks } = req.body;

//     for (const task of tasks) {
//       const Model = Models[task.model];
//       if (!Model) return res.status(400).json({ error: `Invalid model: ${task.model}` });

//       const content = await Model.findById(task.contentId);
//       if (!content) return res.status(404).json({ error: `${task.model} content not found` });

//       if (task.type === 'quiz' && (!content.quiz || content.quiz.length === 0)) {
//         return res.status(400).json({ error: 'No quiz available for this content' });
//       }
//     }

//     const challenge = await DailyChallenge.create({ date, tasks });
//     res.status(201).json(challenge);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Get daily challenge for a specific date
// exports.getDailyChallenge = async (req, res) => {
//   try {
//     const { date } = req.params;
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: 'userId is required' });

//     const challenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
//     if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

//     const mutableChallenge = { ...challenge };
//     let userProgress = mutableChallenge.userProgress.find((p) => p.userId.toString() === userId);

//     if (!userProgress) {
//       userProgress = {
//         userId,
//         completedTasks: challenge.tasks.map((t) => ({
//           taskId: t._id,
//           completed: false,
//         })),
//         completed: false,
//         status: 'None',
//       };
//       await DailyChallenge.updateOne(
//         { _id: challenge._id },
//         { $push: { userProgress } }
//       );
//     }

//     // Sync task progress with content models
//     for (const task of mutableChallenge.tasks) {
//       const Model = Models[task.model];
//       if (!Model) {
//         console.warn(`Model not found: ${task.model}`);
//         continue;
//       }

//       const content = await Model.findById(task.contentId);
//       if (!content) {
//         console.warn(`Content not found: ${task.contentId}`);
//         continue;
//       }

//       let taskProgress = userProgress.completedTasks.find(
//         (t) => t.taskId.toString() === task._id.toString()
//       );
//       if (!taskProgress) {
//         taskProgress = { taskId: task._id, completed: false };
//         userProgress.completedTasks.push(taskProgress);
//       }

//       if (task.type === 'video') {
//         const watch = content.watchProgress?.find((p) => p.userId.toString() === userId);
//         taskProgress.completed = watch?.completed || false;
//       } else if (task.type === 'quiz') {
//         const quizProgress = content.quizProgress?.find((p) => p.userId.toString() === userId);
//         taskProgress.completed = quizProgress?.completed || false;
//       }
//     }

//     // Update completion status
//     userProgress.completed = userProgress.completedTasks.every((t) => t.completed);

//     // Respect existing status (set by storeResult)
//     if (userProgress.completed && userProgress.status !== 'Gold') {
//       userProgress.status = 'Silver';
//       if (!userProgress.completionDate) {
//         userProgress.completionDate = new Date();
//       }
//     } else if (!userProgress.completed) {
//       userProgress.status = 'None';
//       userProgress.completionDate = null;
//     }

//     // Save updated userProgress
//     await DailyChallenge.updateOne(
//       { _id: mutableChallenge._id, 'userProgress.userId': userId },
//       { $set: { 'userProgress.$': userProgress } }
//     );

//     // Fetch updated challenge
//     const updatedChallenge = await DailyChallenge.findOne({ date }).populate('tasks.contentId').lean();
//     res.json(updatedChallenge);
//   } catch (err) {
//     console.error('Error in getDailyChallenge:', err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // Get all challenges (completed and uncompleted) for a specific user
// exports.getChallengeHistory = async (req, res) => {
//   try {
//     const { userId } = req.query;
//     if (!userId) return res.status(400).json({ error: 'userId is required' });

//     const challenges = await DailyChallenge.find({})
//       .populate('tasks.contentId')
//       .sort({ date: -1 })
//       .lean();

//     // Ensure userProgress exists for each challenge
//     for (const challenge of challenges) {
//       let userProgress = challenge.userProgress.find((p) => p.userId.toString() === userId);
//       if (!userProgress) {
//         userProgress = {
//           userId,
//           completedTasks: challenge.tasks.map((t) => ({
//             taskId: t._id,
//             completed: false,
//           })),
//           completed: false,
//           status: 'None',
//         };
//         await DailyChallenge.updateOne(
//           { _id: challenge._id },
//           { $push: { userProgress } }
//         );
//         challenge.userProgress.push(userProgress);
//       }

//       // Sync task progress
//       for (const task of challenge.tasks) {
//         const Model = Models[task.model];
//         if (!Model) continue;

//         const content = await Model.findById(task.contentId);
//         if (!content) continue;

//         let taskProgress = userProgress.completedTasks.find(
//           (t) => t.taskId.toString() === task._id.toString()
//         );
//         if (!taskProgress) {
//           taskProgress = { taskId: task._id, completed: false };
//           userProgress.completedTasks.push(taskProgress);
//         }

//         if (task.type === 'video') {
//           const watch = content.watchProgress?.find((p) => p.userId.toString() === userId);
//           taskProgress.completed = watch?.completed || false;
//         } else if (task.type === 'quiz') {
//           const quizProgress = content.quizProgress?.find((p) => p.userId.toString() === userId);
//           taskProgress.completed = quizProgress?.completed || false;
//         }
//       }

//       // Update completion status
//       userProgress.completed = userProgress.completedTasks.every((t) => t.completed);
//       if (userProgress.completed && userProgress.status !== 'Gold') {
//         userProgress.status = 'Silver';
//         if (!userProgress.completionDate) {
//           userProgress.completionDate = new Date();
//         }
//       } else if (!userProgress.completed) {
//         userProgress.status = 'None';
//         userProgress.completionDate = null;
//       }

//       await DailyChallenge.updateOne(
//         { _id: challenge._id, 'userProgress.userId': userId },
//         { $set: { 'userProgress.$': userProgress } }
//       );
//     }

//     // Refetch to ensure latest data
//     const updatedChallenges = await DailyChallenge.find({})
//       .populate('tasks.contentId')
//       .sort({ date: -1 })
//       .lean();

//     res.json(updatedChallenges);
//   } catch (err) {
//     console.error('Error in getChallengeHistory:', err);
//     res.status(500).json({ error: err.message });
//   }
// };