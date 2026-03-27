
const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseModel: {
    type: String,
    required: true,
    enum: ['LearningChallenge', 'Plenary', 'Classroom','OnDjob' /* other models */],
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'courseModel',
  },
  correctAnswers: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
});

const QuizResult = mongoose.model('QuizResult', quizResultSchema);
module.exports = QuizResult;