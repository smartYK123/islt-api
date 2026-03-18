const express = require("express");
const router = express.Router();
const {
  submitParticipation,
  getAllParticipations,
  getTotalParticipants,
} = require("../controllers/participationController");

// POST: submit participation form
router.post("/", submitParticipation);

// GET: all participations
router.get("/", getAllParticipations);

// GET: total participants
router.get("/total", getTotalParticipants);

module.exports = router;
