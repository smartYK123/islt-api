const mongoose = require("mongoose");
// Subschema for a task (video or quiz from any model)
const taskSchema = new mongoose.Schema({
  model: {
    type: String,
    required: true,
    enum: [
      "Classroom",
      "Cecbs",
      "Classics",
      "Plenary",
      "OnDjob",
      "ExcellenceSeriesHF",
      "SpotlightAward",
      "SpotlightOnEx",
      "GoalSettting",
      "LoveStaffCulture",
      "Healthcare",
      "MessageExcept",
      "LearningChallenge",
      "Promo",
      "SpotOnExMain",
      "FaithProclaim",
      "ExcelAns4u",
      "Bltas",
      "ExcelStaffSeries",
      "HealthCare"
    ],
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "tasks.model",
  },
  type: {
    type: String,
    required: true,
    enum: ["video", "quiz"],
  },
});

// Subschema for user progress
// In models/DailyChallenge.js
const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lsdc",
    required: true,
  },
  completedTasks: [
    {
      taskId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      completed: {
        type: Boolean,
        default: false,
      },
      quizAnswers: [
        {
          questionId: mongoose.Schema.Types.ObjectId,
          selectedAnswer: String,
          isCorrect: Boolean,
        },
      ],
    },
  ],
  completed: {
    type: Boolean,
    default: false,
  },
  completionDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["Gold", "Silver", "None"],
    default: "None",
  },
});

// Main schema for daily challenge
const dailyChallengeSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    tasks: [taskSchema],
    userProgress: [userProgressSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyChallenge", dailyChallengeSchema);

// const mongoose = require('mongoose');

// const dailyTaskSchema = new mongoose.Schema({
//   type: { type: String, enum: ['video', 'quiz'], required: true },
//   model: { type: String, required: true },
//   contentId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'tasks.model' },
// });

// const userTaskProgressSchema = new mongoose.Schema({
//   taskId: { type: mongoose.Schema.Types.ObjectId, required: true },
//   completed: { type: Boolean, default: false },
//   quizAnswers: [
//     {
//       questionId: mongoose.Schema.Types.ObjectId,
//       selectedAnswer: String,
//       isCorrect: Boolean,
//     },
//   ],
// });

// const userProgressSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Lsdc' },
//   completedTasks: [userTaskProgressSchema],
//   completed: { type: Boolean, default: false },
//   completionDate: { type: Date },
// });

// const dailyChallengeSchema = new mongoose.Schema({
//   date: { type: String, required: true }, // consider using YYYY-MM-DD format string
//   tasks: [dailyTaskSchema],
//   userProgress: [userProgressSchema],
// });

// module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);
