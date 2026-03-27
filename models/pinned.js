// // models/Comment.js
// const mongoose = require('mongoose');

// const pinnedSchema = new mongoose.Schema({
//   text: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model('Pin', pinnedSchema);
const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  scheduledTime: {
    type: String, // Example format: "morning", "noon", "night"
    required: true,
  },
});

const PinnedNoticesSchema = new mongoose.Schema({
  notices: [noticeSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PinnedNotices = mongoose.model('PinnedNotices', PinnedNoticesSchema);

module.exports = PinnedNotices;
