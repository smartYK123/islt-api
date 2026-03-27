// routes/pinnedNoticesRoutes.js
const express = require('express');
const router = express.Router();
const pinnedNoticesController = require("../controllers/pinnedNotifyControlleer")
router.post('/notices', pinnedNoticesController.createNotice);
router.get('/notices', pinnedNoticesController.getNotices);
// router.put('/notices/:id', pinnedNoticesController.updateNotice);
router.put('/notices/:id', pinnedNoticesController.updateNotice); // Update notice
router.delete('/notices/:id', pinnedNoticesController.deleteNotice); // Delete notice
module.exports = router;

