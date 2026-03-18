// const mongoose = require('mongoose');

// const downloadSchema = new mongoose.Schema({
//   title: String,
//   thumbnail: String,
//   image: String,
//   path: String,
//   type: String,
//   filename: String,
// });

// const goalSchema = new mongoose.Schema({
//   text: String,
// });

// const lsdcSchema = new mongoose.Schema({
//   portalID: { type: String, required: true, unique: true },
//   firstName: { type: String, required: true },
//   deptID: { type: String, required: true },
//   deptName: { type: String, required: true },
//   title: { type: String, required: true },
//   maritalStatus: { type: String, required: true },
//   gender: { type: String, required: true },
//   picturePath: { type: String, required: true },
//   lastName: { type: String, required: true },
//   designation: { type: String, required: true },
//   rankName: { type: String, required: true },
//   nationality: { type: String, required: true },
//   jobFamilyName: { type: String, required: true },
//   espee: { type: String },
//   downloads: [downloadSchema],
//   goals: [goalSchema],
//   verificationToken: String,
// }, { timestamps: true });

// const Lsdc = mongoose.model('Lsdc', lsdcSchema);

const mongoose = require('mongoose');
const downloadSchema = new mongoose.Schema({
  title: String,
  thumbnail: String,
  image: String,
  path: String,
  type: String,
  filename: String,
});
// Department Access Code Schema
const deptAccessSchema = new mongoose.Schema({
    deptName: {
      type: String,
      required: true,
      unique: true
    },
    deptCode: {
      type: String, // Base department code (e.g., "LSDC", "NCZ2")
      required: true
    },
    accessCode: {
      type: String,
      required: true,
      unique: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
const goalSchema = new mongoose.Schema({
  text: String,
});

const LsdcSchema = new mongoose.Schema({
  portalID: { type: String, required: true, unique: true },
  firstName: {
    type: String,
},
todos:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Todo",
    }
],
deptID: {
    type: String,
},
deptName: {
    type: String,
},
title: {
    type: String,
},
maritalStatus: {
    type: String,
},
gender: {
    type: String,
},
picturePath: {
    type: String,
},
lastName: {
    type: String,
},
 designation: {
    type: String,
},
rankName: {
    type: String,
},
nationality: {
    type: String,
},
kc: {
    type: String,
},
espees: {
    type: String,
},
number: {
    type: String,
},
dob: {
    type: String,
},
isSubscribed: { type: Boolean, default: false },
subscriptionExpiryDate: {
    type: Date,
  },
// subscriptionExpiryDate: { type: Date, default: null },
isOnFreeTrial: { type: Boolean, default: true}, // Starts with a free trial
freeTrialStartDate: { type: Date, default: Date.now },
freeTrialEndDate: { 
  type: Date, 
  default: () => {
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 3); // Add 6 months to the current date
    return currentDate;
  }
},
// freeTrialEndDate: { type: Date, default: () => Date.now() + 3 * 24 * 60 * 60 * 1000 }, 
voucherCode: { type: String, default: null },
department: { type: String, default: null },
jobFamilyName: {
    type: String,
},
pushToken: { type: String }, // Store the push token here

 
  downloads: [downloadSchema],
  goals: [goalSchema],
  verificationToken: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // other fields as needed
});

const Lsdc = mongoose.model('Lsdc', LsdcSchema);
const DeptAccess = mongoose.model('DeptAccess', deptAccessSchema);
module.exports = { Lsdc, DeptAccess };

// External login response: Object {
//     "message": "Success",
//     "status": true,
//     "user": Object {
//       "deptID": "318",
//       "deptName": "Loveworld Staff Development Center",
//       "designation": "Junior Programmer 4",
//       "emailAddress": "pastoryk@loveworld360.com",
//       "firstName": "OLAYINKA ",
//       "gender": "Male",
//       "jobFamily": "3",
//       "jobFamilyName": "IT",
//       "lastName": "OGUNDIPE",
//       "maritalStatus": "Single",
//       "nationality": "Nigeria",
//       "picturePath": "https://blwstaffportal.org/user_res/picture/h/106077.jpg",
//       "portalID": "106077",
//       "rankID": "0",
//       "rankName": "NO RANK",
//       "subDept": null,
//       "title": "Pastor",
//     },
//   }
  