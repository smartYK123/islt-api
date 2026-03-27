// const mongoose = require('mongoose');

// const contentSchema = new mongoose.Schema({
//     title: String,
//     description: String,
//     eventId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Meeting' // Reference to the event
//     },
//     contentUrl: String, // URL or file path to the content (e.g., video, article)
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });5

// const Content = mongoose.model('Content', contentSchema);

// module.exports = Content;


const mongoose = require('mongoose');

// Schema for quiz questions
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String], // Array of options
    required: true,
    validate: [optionsLimit, 'There must be four options.'], // Validator for exactly 4 options
  },
  correctAnswer: {
    type: String, // One of the options should be correct
    required: true,
    trim: true,
  },
});

// Validator to ensure exactly 4 options
function optionsLimit(val) {
  return val.length === 4;
}

// Subschema for media content
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

// Main schema for content and quiz (Classroom model)
const programSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
    trim: true,
  },
  timeLimit: {
    type: Number, // Time limit in minutes
    required: true,
    min: [1, 'Time limit must be at least 1 minute.'], // Minimum value of 1 minute
  },
  media: mediaSchema, // Media associated with the content
  quiz: [questionSchema], // Array of quiz questions
  deptName: String,       // Department for filtering
  gender: String,         // Gender for filtering
  designation: String,    // Designation for filtering
  maritalStatus:String, 
  rankName:String,
  portalIds: [String], // Support multiple or single portal IDs
  forAllUsers: {          // For all users or specific ones
    type: Boolean,
    default: false
  },
  acceptedBy: [{          // Track users who have accepted the related event
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lsdc',
  }],
  accepted: {             // Whether the content is accepted by the user
    type: Boolean,
    default: false
  },
}, { timestamps: true });

const Programs = mongoose.model('Programs', programSchema);

module.exports = Programs;


//https://vcpout-sf01-altnetro.internetmultimediaonline.org/ext/ext1.smil/playlist.m3u8
//https://hq2.kingsconference.org/miraclesamuel
//http://162.210.199.3/Media/Videos/SW202501/2025-COMPLETENESS-%20IXL%20good.mp4