const express = require('express');
const router = express.Router();
const dailyChallengeController = require('../controllers/dailyCbChallengeController');
// const trackProgressController = require('../controllers/trackProgressController');

// Daily Challenge routes
router.post('/daily-challenges', dailyChallengeController.createDailyChallenge);
router.get('/daily-challenges/today', dailyChallengeController.getTodaysChallenge);
router.get('/daily-challenges/:date', dailyChallengeController.getChallengeByDate);
router.get('/daily-challe', dailyChallengeController.getAllChallenge);
router.get('/daily-challenges', dailyChallengeController.getAllChallenges);
router.patch('/daily-challenges/:challengeId/tasks/:taskId/complete', dailyChallengeController.markTaskCompleted);
router.get('/users/:userId/stats', dailyChallengeController.getUserStats);
router.get('/daily-challenges/:challengeId/users-by-department',dailyChallengeController.getDailyChallengeUsersByDepartment);
router.get('/daily-challenges/:challengeId/status-by-dept',dailyChallengeController.getDailyChallengeUsersByDeptID);
router.get('/daily-challenges/status/:userId', dailyChallengeController.getUserChallengeStatus);
router.patch('/upgrade/gold/:userId',dailyChallengeController.upgradeAllSilverChallengesToGold);
router.patch('/daily-challenges/:challengeId/upgrade/gold/:userId',dailyChallengeController.upgradeUserToGoldForChallenge);

router.get('/departments/verify', dailyChallengeController.verifyDeptID);
// Track Supersession progress
// router.patch('/supersession/:id/track-progress', trackProgressController.trackSupersessionProgress);

module.exports = router;