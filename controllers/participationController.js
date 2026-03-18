const Participation = require("../models/participationModel");

// @desc Submit a new participation entry
// @route POST /participation
// @access Public or Authenticated (depending on your setup)
exports.submitParticipation = async (req, res) => {
  try {
    const { userId, name, department, participants } = req.body;

    if (!userId || !name || !department || !participants) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const participation = new Participation({
      userId,
      name,
      department,
      participants,
    });

    await participation.save();

    res.status(201).json({
      success: true,
      message: "Participation submitted successfully",
      participation,
    });
  } catch (error) {
    console.error("Error submitting participation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting participation",
      error: error.message,
    });
  }
};

// @desc Get all participation records
// @route GET /participation
exports.getAllParticipations = async (req, res) => {
  try {
    const participations = await Participation.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      total: participations.length,
      participations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching participation records",
      error: error.message,
    });
  }
};

// @desc Get total participants count
// @route GET /participation/total
exports.getTotalParticipants = async (req, res) => {
  try {
    const participations = await Participation.find();
    const total = participations.reduce(
      (sum, p) => sum + Number(p.participants || 0),
      0
    );

    res.status(200).json({
      success: true,
      totalParticipants: total,
      totalSubmissions: participations.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating total participants",
      error: error.message,
    });
  }
};
