const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    time: { type: String },
    mentor: { type: String },

    expiresAt: { type: Date, required: true }, // 🔥 auto expiry
    isExpired: { type: Boolean, default: false }, // manual expiry

    acceptedUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        acceptedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);