const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  contentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'model',
    required: function() { return this.model === 'Plenary'; }
  },
  model: { type: String, enum: ['Plenary', 'External'], required: true },
  type: { type: String, enum: ['video', 'external'], required: true },
  title: { type: String, required: true },
  link: { type: String }, // For external tasks like ROR link
  order: { type: Number, required: true }, // To maintain task order
});

const userTaskProgressSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, required: true },
  completed: { type: Boolean, default: false },
  completionDate: { type: Date },
  completionTimestamp: { type: String }, // HH:MM format
});

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lsdc', required: true },
  tasks: [userTaskProgressSchema], // Track each task separately
  completed: { type: Boolean, default: false },
  status: { type: String, enum: ['Gold', 'Silver', 'None'], default: 'None' },
  completionDate: { type: Date },
  lastUpdated: { type: Date, default: Date.now },
});

const dailyChallengeSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true, 
    unique: true,
    index: true 
  }, // Format: YYYY-MM-DD
  dayName: { type: String, required: true }, // e.g., "Thursday"
  dayNumber: { type: Number, required: true }, // e.g., 1 (Day 1)
  formattedDate: { type: String, required: true }, // e.g., "15th January 2026"
  tasks: [taskSchema],
  userProgress: [userProgressSchema],
  isActive: { type: Boolean, default: true },

}, { timestamps: true });

// Index for faster queries
dailyChallengeSchema.index({ date: 1 });
dailyChallengeSchema.index({ 'userProgress.userId': 1 });

module.exports = mongoose.model('DailyCbChallenge', dailyChallengeSchema);