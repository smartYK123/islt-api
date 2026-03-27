const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lsdc', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Programs', required: true },
  correctAnswers: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
});

const QuizProgramResult = mongoose.model('QuizProgramResult', quizResultSchema);
module.exports = QuizProgramResult;