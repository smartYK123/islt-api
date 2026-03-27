// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Elite', required: true },
  text: { type: String, required: true },
  name: {
    type: String,
    required: true
  },
  picture: {
    uri: {
      type: String,
      required: true
    }
  },
  department: {
    type: String,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Comment', commentSchema);

