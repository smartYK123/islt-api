// routes/onDjobRoutes.js
const express = require('express');
const router = express.Router();
const traingISLTController = require('../controllers/traingISLTController');

// const { createOnDjob, trackWatchProgress, getCompletedViewers } = require("../controllers/onDjobController");

// // router.post("/", createOnDjob);
router.post("/:id/progress", traingISLTController.trackWatchProgress);
router.get('/summary', traingISLTController.getTrainingVideoProgress);
router.post("/", traingISLTController.createTrainingVideo);
router.get("/", traingISLTController.getTrainingVideos);
// router.post("/:id/web-progress", traingISLTController.trackWatchProgressWeb);
// router.get("/:id/completed-viewers", getCompletedViewers);
// router.get('/:id/progress', traingISLTController.getWatchProgress);
// router.get('/:plenaryId/users', traingISLTController.getPlenaryUsersProgress);
// router.get('/completed/:userId', traingISLTController.getUserCompletedPlenaries);

module.exports = router;
