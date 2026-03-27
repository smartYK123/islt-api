const express = require('express');
const router = express.Router();
const quizDurationController = require('../controllers/quizDurationController');

// POST: Create or update quiz duration
router.post('/quiz-duration', quizDurationController.createQuizDuration);

// GET: Retrieve quiz duration by ID or all makelive durations
router.get('/quiz-duration/:id?', quizDurationController.getQuizDuration);

module.exports = router;