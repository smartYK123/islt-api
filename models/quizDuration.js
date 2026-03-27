const mongoose = require('mongoose');

const quizDurationSchema = new mongoose.Schema({
    time: Number,

    makelive: {       // If true, it is for all users
        type: Boolean,
        default: false
    },
    questions:Number,
    title:String
});

const QuizDuration = mongoose.model('QuizDuration', quizDurationSchema);

module.exports = QuizDuration;
