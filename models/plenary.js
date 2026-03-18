// const mongoose = require('mongoose');

// // Subschema for quiz questions
// const questionSchema = new mongoose.Schema({
//   question: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   options: {
//     type: [String], // Array of strings for options
//     required: true,
//     validate: [optionsLimit, 'There must be four options.'], // Custom validator for exactly 4 options
//   },
//   correctAnswer: {
//     type: String, // Correct answer should match one of the options
//     required: true,
//     trim: true,
//   },
// });

// // Validator to ensure exactly 4 options
// function optionsLimit(val) {
//   return val.length === 4;
// }
// const watchProgressSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lsdc', required: true },
//   name: { type: String },
//   department: { type: String },
//   watchedPercentage: { type: Number, required: true },
//   completed: { type: Boolean, default: false },
//   activeWatchDuration: { type: Number, default: 0 }, // seconds actively watched
//   totalDuration: { type: Number },
//   date: { type: Date, default: Date.now },
// });
// // Subschema for media
// const mediaSchema = new mongoose.Schema({
//   type: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   content: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   thumbnail: {
//     type: String,
//     trim: true,
//   },
// });

// // Main schema for trending content
// const plenarySchema = new mongoose.Schema({
//   id: {
//     type: String,
//     required: true,
//   },
//   user: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   title: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   timeLimit: {
//     type: Number, // Time limit in minutes
//     min: [1, 'Time limit must be at least 1 minute.'], // Minimum value of 1 minute
//   },
//   image: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   media: mediaSchema,
//   trending: {
//     type: Boolean,
//     default: false,
//   },
//   description: {
//     type: String,
//     trim: true,
//   },
//   quiz: [questionSchema], // Add quiz field as an array of questions
//   watchProgress: [watchProgressSchema],
  
// }, { timestamps: true });

// // Define the model
// const Plenary = mongoose.model('Plenary', plenarySchema);

// module.exports = Plenary;



const mongoose = require('mongoose');

// Subschema for quiz questions
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String], // Array of strings for options
    required: true,
    validate: [optionsLimit, 'There must be four options.'], // Custom validator for exactly 4 options
  },
  correctAnswer: {
    type: String, // Correct answer should match one of the options
    required: true,
    trim: true,
  },
});

// Validator to ensure exactly 4 options
function optionsLimit(val) {
  return val.length === 4;
}

// Subschema for watch progress
// const watchProgressSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lsdc', required: true },
//   name: { type: String },
//   department: { type: String },
//   completed: { type: Boolean, default: false },
//   date: { type: Date, default: Date.now },
// });
const watchProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lsdc', required: true },
  name: { type: String },
  department: { type: String },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  completionTimestamp: { type: String } // ✅ REQUIRED
});
// Subschema for media
const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  thumbnail: {
    type: String,
    trim: true,
  },
});

// Main schema for trending content
const plenarySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  timeLimit: {
    type: Number, // Time limit in minutes
    min: [1, 'Time limit must be at least 1 minute.'], // Minimum value of 1 minute
  },
  image: {
    type: String,
    required: true,
    trim: true,
  },
  media: mediaSchema,
  trending: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    trim: true,
  },
    challenge: {
    isChallengeContent: { type: Boolean, default: false },
    challengeWeek: { type: Number }, // Week number relative to challenge start (1–8)
    challengeDate: { type: Date },
  },
  quiz: [questionSchema], // Array of quiz questions
  watchProgress: [watchProgressSchema],
}, { timestamps: true });

// Add unique index on watchProgress.userId to prevent duplicates
// plenarySchema.index({ 'watchProgress.userId': 1 }, { unique: true, sparse: true });

// Define the model
const Plenary = mongoose.model('Plenary', plenarySchema);

module.exports = Plenary;



