// const express = require('express');
// const router = express.Router();
// const dailyChallengeController = require('../controllers/dailyChallengeController');

// router.post('/', dailyChallengeController.createDailyChallenge);
// router.get('/:date',  dailyChallengeController.getDailyChallenge);
// router.post('/quiz',  dailyChallengeController.submitQuiz);
// // router.get('/history', dailyChallengeController.getChallengeHistory);
// // router.get('/:date/completion', dailyChallengeController.getDailyChallengeCompletion);
// // router.post('/mark-video-complete',dailyChallengeController.markVideoComplete);
// router.get('/admin/completed-users/:date', dailyChallengeController.getCompletedUsers);

// module.exports = router;




// routes/dailyChallengeRoutes.js

const express = require('express');
const router = express.Router();
const dailyChallengeController = require('../controllers/dailyChallengeController');

router.post('/',  dailyChallengeController.createDailyChallenge);
router.get('/history', dailyChallengeController.getChallengeHistory);
// router.get('/hist', dailyChallengeController.getChallengeHis);

router.get('/completed', dailyChallengeController.getCompletedChallenges);
// router.get('/', dailyChallengeController.getAllDailyChallenges);

router.post('/fix-progress', dailyChallengeController.fixChallengeProgress);
router.post('/fix-All-progress', dailyChallengeController.fixAllChallengesProgress);
// router.post('/status-upgrade', dailyChallengeController.assignGoldStatusToAll);
router.get('/',  dailyChallengeController.getNonGoldUsers);
router.post('/assignGold', dailyChallengeController.assignGoldToNoneUsers);
router.post('/assignGold52', dailyChallengeController.assignGoldToFirst52NonGoldUsers);
router.post('/migrate-users-to-status', dailyChallengeController.migrateUsersToStatus);
router.post('/assignSilver', dailyChallengeController.assignSilverToNoneUsers);
router.get('/noneStatusUsers',  dailyChallengeController.getNoneStatusUsers);
router.post('/assign-gold-to-none-partial', dailyChallengeController.assignGoldToNoneWithPartialCompletion);
router.post('/assignGoldToUsersAcross', dailyChallengeController.assignGoldToUsersAcrossAllChallenges);
router.get('/gold-status-users', dailyChallengeController.getGoldStatusUsers);
router.post('/assign-silver-to-none-partial', dailyChallengeController.assignSilverToNoneWithPartialCompletion);
router.get('/:date', dailyChallengeController.getDailyChallenge);
// router.get('/:dates', dailyChallengeController.getDailyChall);

// Existing route
// router.get('/user/:userId/status', authMiddleware, getUserAllChallengesStatus);

// New certificate download route
router.get('/certificate/:userId/:certificateId', dailyChallengeController.downloadChallengeCertificate);

router.get('/:challengeId/status/:userId', dailyChallengeController.getUserChallengeStatus);
router.get('/status/:userId', dailyChallengeController.getUserAllChallengesStatus);
router.post('/submit-quiz',  dailyChallengeController.submitQuiz);
router.get('/check-task', dailyChallengeController.checkDailyChallengeTask); // New route
router.post('/:challengeId/set-all-gold', dailyChallengeController.setAllCompletedTasksGold);
module.exports = router;
// 6788d24aa03ec95536b4b354
// 68137e50ecdb4a49f8a1b7c9
