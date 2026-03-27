const mongoose = require('mongoose');

const warLikeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Elite', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'WarRoom', required: true },
    liked: { type: Boolean, default: false } // Track whether the post is liked or not
  });

  module.exports = mongoose.model('warLike', warLikeSchema);