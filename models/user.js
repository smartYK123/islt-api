// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     password: {
//         type: String,
//         required: true,
//     },
//     verified: {
//         type: Boolean,
//         default: false
//     },
//     phone: {
//         type: String,
//         trim: true
//     },
//     picture: {
//         url: String,
//         public_id: String,
//     },
//     role: {
//         type: String,
//         trim: true
//     },
//     verificationToken: String,
//     address: [{
//         name: String,
//         mobileNo: String,
//         houseNo: String,
//         street: String,
//         landmark: String,
//         city: String,
//         country: String,
//         postalCode: String
//     }],

//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// const User = mongoose.model("User", userSchema);
// module.exports = User;
// const mongoose = require("mongoose");

// const UserIsltSchema = new mongoose.Schema({
//   kc_id: String,
//   username: String,
//   name: String,
//   phone: String,
//   email: String,
//   image: String,
//   kc_token: String, // temporary token for deep link
// });

// // module.exports = mongoose.model("UserIslt", UserIsltSchema);
// module.exports = mongoose.models.UserIslt || mongoose.model("UserIslt", UserIsltSchema);




const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    kc_id: { type: String, unique: true },
    username: String,
    name: String,
    phone: String,
    email: String,
    image: String,
    menteeCode: { type: String, default: null },
    kc_token: String,
    kc_token_expiry: Date,
        // ✅ NEW FIELD
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);