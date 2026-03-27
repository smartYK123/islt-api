const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

router.post("/create", eventController.createEvent);
router.get("/active", eventController.getActiveEvents);
router.post("/accept/:eventId", eventController.acceptEvent);
router.patch("/expire/:eventId", eventController.expireEvent);

module.exports = router;