const mongoose = require('mongoose');
const { Schema } = mongoose;

/** question model */
const questionModel = new Schema({
    questions: { type : Array, default: []}, // create question with [] default value
    answers : { type : Array, default: []},
    convertToLetters:  { type : Array, default: []},
    createdAt: { type: Date, default: Date.now },
    title: { type: String, default: "Untitled Quiz" },
});
const Question = mongoose.model('Question', questionModel);

module.exports = Question;
