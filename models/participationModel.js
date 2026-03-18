const mongoose = require("mongoose");

const participationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  participants: {
    type: Number,
    required: true,
     min: [1, 'Participants must be at least 1']
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Participation", participationSchema);
