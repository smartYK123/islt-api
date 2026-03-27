// const mongoose = require('mongoose');

// const videoSchema = new mongoose.Schema({
//   videoUrl: {
//     type: String,
//     required: true,
//   },
//   title: {
//     type: String,
//     required: true
//   },
//   thumbnails: {
//     type: String,
//   },
//   description: {
//     type: String,
//   },
//       fetchedBy: [
//         {
//           userId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Lsdc',
//           },
//           name: {
//               type: String,
//             },
//           department: String,
//           date: { type: Date, default: Date.now }
//         },
//       ],
// });



// const Video = mongoose.model('Video', videoSchema);

const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  videoUrl: { type: String, required: true },
  title: { type: String, required: true },
  thumbnails: { type: String },
  description: { type: String },
  scheduledTime: { type: Date, default: null }, // Optional Scheduled Time
  fetchedBy: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lsdc' },
      name: { type: String },
      department: String,
      date: { type: Date, default: Date.now }
    },
  ],
});

const Video = mongoose.model('Video', videoSchema);

// Like Model
const likeSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lsdc',
    required: true
  }
});

const Like = mongoose.model('HomeLike', likeSchema);

// Comment Model
const commentSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lsdc',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  name: {
    type: String,
  },
  picture: {
    uri: {
      type: String,
      required: true
    },

  },
  department: {
    type: String
  },
  createdAt: { type: Date, default: Date.now },

});

const Comment = mongoose.model('homeComment', commentSchema);

module.exports = { Video, Like, Comment };
