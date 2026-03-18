// routes/cecbsRoutes.js
const express = require('express');
const router = express.Router();
const plenaryController = require('../controllers/plenaryController');

// Get quiz for a specific course
router.get('/:courseId/quiz', plenaryController.getQuiz);

// Submit quiz answers and get results
router.post('/:courseId/quiz/submit', plenaryController.submitQuiz);
router.put('/:courseId/quiz', plenaryController.addOrUpdateQuiz);
router.get('/courses-with-quiz', plenaryController.getCoursesWithQuiz);
router.get('/results/:userId', plenaryController.getUserQuizResults);
router.delete('/courses/:courseId/quiz', plenaryController.deleteQuiz);

// Route to submit quiz
// router.post('/courses/:courseId/quiz/submit', quizController.submitQuiz);

// Route to check quiz completion
router.get('/:courseId/quiz/check-completion', plenaryController.checkQuizCompletion);

module.exports = router;
