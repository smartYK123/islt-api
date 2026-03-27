const express = require('express');
const router = express.Router();
const eventController = require('../controllers/myMeetingController');
const programController = require("../controllers/specialProgController")

// POST an event
router.post('/events', eventController.postEvent);
router.put('/events/:eventId', eventController.updateEvent);
router.post('/events/:eventId/enroll', eventController.enrollInModules);
router.post('/:meetingId/track-progress', eventController.trackModuleProgress);
router.post('/update', eventController.updateEnrolledModuleContent);


// router.route('/:meetingId/track-progress')
//   .post(eventController.trackModuleProgress)
//   .get(eventController.trackModuleProgress);
router.get('/:meetingId/certificate/:certificateId', eventController.downloadCertificate);
router.post('/:meetingId/module-comment', eventController.addModuleComment);
// In your eventRoutes.js or equivalent
router.get('/:meetingId/module-comments-likes', eventController.getModuleCommentsAndLikes);
// Get detailed department course series completion status
router.get('/dept/:accessCode/course-series/status', eventController.getDeptCourseSeriesCompletion);
router.post('/:meetingId/module-like', eventController.toggleModuleLike);
router.delete('/events/:meetingId/module-comment', eventController.deleteModuleComment);
router.get('/events', eventController.getEvents);
router.delete('/events/:eventId', eventController.deleteEvent);
// New routes for adding modules
router.post('/:meetingId/add-modules-to-course-series', eventController.addModulesToCourseSeries);
router.post('/:meetingId/add-modules-to-user-enrollment', eventController.addModulesToUserEnrollment);
// Route to post content with quiz
router.post('/programs', programController.postClassroomContent);
// Route to get content and quiz only for users who accepted the event
router.get('/programs', programController.getAcceptedClassroomContent);
router.get('/programs-accepted', programController.getAcceptedProgramContent);
router.get('/:courseId/programs-quiz', programController.getClassroomWithQuiz);
// Route to delete content
router.delete('/programs/:contentId', programController.deleteClassroomContent);
// GET events based on filters

router.get('/program-results/:userId', programController.getUserQuizResults);
router.delete('/programs/:courseId/quiz', programController.deleteQuiz);
// Route to get program content by ID
router.get('/programs/:programId', programController.getProgramContent);
// Accept an event
router.post('/events/accept', eventController.acceptEvent);
router.get('/:courseId/programs-quiz/check-completion', programController.checkQuizCompletion);
router.post('/:courseId/programs-quiz/submit', programController.submitQuiz);
router.get('/programs-with-quiz',  programController.getCoursesWithQuiz);

// router.post('/events/:eventId/enroll', enrollInModules);

// DELETE an event


module.exports = router;


