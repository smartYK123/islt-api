// Comment model (Comment.js)
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Elite' }, // Assuming you have a User model
    text: { type: String, required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'WarRoom' },
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

const Comment = mongoose.model('WarComment', commentSchema);

module.exports = Comment;

