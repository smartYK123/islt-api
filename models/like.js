const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Elite', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    liked: { type: Boolean, default: false } // Track whether the post is liked or not
  });

module.exports = mongoose.model('Like', likeSchema);
