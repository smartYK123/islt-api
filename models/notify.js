// Define the model

// Define the model

const mongoose = require('mongoose');

const NotifySchema = new mongoose.Schema({
  id: String,
  user: String,
  title: String,
  image: String,
  caaoiselimage: {
    type: [String], // Array of image URLs
    default: [], // Default to an empty array
  },
  media: {
    type: {
      type: String,
    },
    content: String,
    thumbnail: String,
  },
  thumbnail: String,
  description: String,
  isNew: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  readBy: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lsdc' }], // Array of user IDs who have read the notification
    default: [],
  }
});
const Notify = mongoose.model('Notify', NotifySchema);

module.exports = Notify;
