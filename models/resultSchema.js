// const mongoose = require('mongoose');
// const { Schema } = mongoose;


// /** result model */
// const resultModel = new Schema({
//     username: { type: mongoose.Schema.Types.ObjectId, ref: 'Lsdc', required: true },
//     dept : { type : String },
//     num : { type : Number },
//     result : { type : Array, default : []},
//     attempts : { type : Number, default : 0},
//     points : { type : Number, default : 0},
//     createdAt : { type : Date, default : Date.now}
// })

// const result = mongoose.model('result', resultModel);

// module.exports =  result;



const mongoose = require('mongoose');
const { Schema } = mongoose;

/** result model */
const resultModel = new Schema({
  username: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dept: { type: String },
  name: {type: String},
  num: { type: String }, // Changed to String to match userData.portalID
  result: { type: Array, default: [] },
  attempts: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  challengeId: { type: String }, // Added for quiz identification
  scorePercentage:{type: String},
  title:{type: String},
  createdAt: { type: Date, default: Date.now },
  quizId: { type: mongoose.Schema.Types.ObjectId }, // Use ObjectId for consistency
});

const result = mongoose.model('result', resultModel);

module.exports = result;




