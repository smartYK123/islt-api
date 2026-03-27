const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // For generating certificate IDs

const mediaSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  thumbnail: {
    type: String,
    trim: true,
  },
});

const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
  content: {
    type: String,
  },
});

const enrolledModuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
  content: {
    type: String,
  },
  watchProgress: {
    completed: {
      type: Boolean,
      default: false,
    },
    completionDate: {
      type: Date,
    },
  },
  comments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      text: {
        type: String,
        required: true,
        trim: true,
      },
      picture: { type: String },
      deptName: { type: String },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  likes: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const enrolledSeriesSchema = new mongoose.Schema({
  seriesTitle: {
    type: String,
    required: true,
  },
  modules: [enrolledModuleSchema],
  certificate: {
    certificateId: {
      type: String,
      // unique: true,
       sparse: true,
    },
    awardedAt: {
      type: Date,
    },
    certificateTemplate: { type: String },
  },
});

const courseSeriesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  minSelection: { type: Number, default: 0 },
  modules: [moduleSchema],
});

const meetingSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    info: String,
    image: String,
    accepted: {
      type: Boolean,
      default: false,
    },
    courseSeries: [courseSeriesSchema],
    enrolledModules: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        enrolledSeries: [enrolledSeriesSchema],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    acceptedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        participationMode: {
          type: String,
          enum: ['Online', 'Onsite'],
          required: function () {
            return this.requireParticipationMode;
          },
        },
        name: {
          type: String,
          required: true,
        },
        picture: {
          type: String,
          required: true,
        },
        department: String,
      },
    ],
    requireParticipationMode: {
      type: Boolean,
      default: false,
    },
    deptName: String,
    gender: String,
    designation: String,
    maritalStatus: String,
    videoUrl: { type: String },
    rankName: String,
    portalIds: [String],
      faculties: {
    type: [String], // array of faculties
    default: ["ALL"], // means visible to everyone
  },
    kc: [String],
    kingsPass: {
      type: Boolean,
      default: false,
    },
    forAllUsers: {
      type: Boolean,
      default: false,
    },
    expiredDate: {
      type: Boolean,
      default: false,
    },
    media: mediaSchema,
  },
  { timestamps: true }
);

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;