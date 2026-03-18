
// routes/onDjobRoutes.js
const express = require('express');
const router = express.Router();
const plenaryChalController = require('../controllers/plenaryChalController');

// const { createOnDjob, trackWatchProgress, getCompletedViewers } = require("../controllers/onDjobController");

// // router.post("/", createOnDjob);
router.post("/:id/progress", plenaryChalController.trackWatchProgress);
// router.get("/:id/completed-viewers", getCompletedViewers);
router.get('/:id/progress', plenaryChalController.getWatchProgress);
router.get('/:plenaryId/users', plenaryChalController.getPlenaryUsersProgress);
router.get('/completed/:userId', plenaryChalController.getUserCompletedPlenaries);

module.exports = router;




// const express = require('express');
// const router = express.Router();
// const { getUserPlenaryProgress } = require('../controllers/plenaryProgress.controller');

// router.get('/plenary/progress/:userId', getUserPlenaryProgress);

// module.exports = router;
