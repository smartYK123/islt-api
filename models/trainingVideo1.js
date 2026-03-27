const mongoose = require('mongoose');

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

const watchProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String },
  department: { type: String },
  completed: { type: Boolean, default: false },
  totalDuration: { type: Number },
  date: { type: Date, default: Date.now },
});

// Main schema for trending content
const trainingVideoSeriesSchema = new mongoose.Schema({
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
  image: {
    type: String,
    required: true,
    trim: true,
  },

  trending: {
    type: Boolean,
    default: false,
  },

  media: mediaSchema,
  watchProgress: [watchProgressSchema],

  description: {
    type: String,
    trim: true,
  },

  // ✅ 🔥 NEW FIELD
  faculties: {
    type: [String], // array of faculties
    default: ["ALL"], // means visible to everyone
  },

}, { timestamps: true });

// Define the model
const TrainingVideo = mongoose.model('TrainingVideo', trainingVideoSeriesSchema);

module.exports = TrainingVideo;
