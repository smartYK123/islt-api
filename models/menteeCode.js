// const mongoose = require("mongoose");

// const menteeCodeSchema = new mongoose.Schema(
//   {
//     code: { type: String, unique: true, required: true },
//     isUsed: { type: Boolean, default: false },
//     usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//     usedAt: { type: Date, default: null }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("MenteeCode", menteeCodeSchema);
const mongoose = require("mongoose");

const menteeCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  used: { type: Boolean, default: false },
      faculty: {
      type: String,
      enum: [
        "Faculty of Foundational Leadership",
        "Faculty of Basic Studies",
        "Faculty of Church Ministry",
        "Faculty of Ministry Department",
      ],
      default: null,
    },
    usedBy:{ type: String },
});

module.exports = mongoose.model("MenteeCode", menteeCodeSchema);