const mongoose = require('mongoose');
const Questions = require('../models/questionSchema.js');
const Results = require('../models/resultSchema.js');
const { questions, answers, convertToLetters,title } = require('../database/data.js');

const calculatePoints = (userAnswers, correctAnswers) => {
  return userAnswers.reduce((acc, answer, index) => {
    return acc + (answer === correctAnswers[index] ? 1 : 0);
  }, 0);
};

/** get all questions */
/** get the latest quiz */
exports.getQuestions = async function (req, res) {
  try {
    const latestQuiz = await Questions.find().sort({ createdAt: -1 }).limit(1);
    res.json(latestQuiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** insert all questions */
exports.insertQuestions = async function (req, res) {
  try {
    const result = await Questions.insertMany({ questions, answers, convertToLetters,title });
    res.json({ msg: 'Data Saved Successfully...!', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** Delete all Questions */
exports.dropQuestions = async function (req, res) {
  try {
    await Questions.deleteMany();
    res.json({ msg: 'Questions Deleted Successfully...!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** get all results */
exports.getResult = async function (req, res) {
  try {
    const r = await Results.find();
    res.json(r);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.storeResult = async function(req, res) {
  try {
    const { username, result: userAnswers, dept, num, quizId, name,title } = req.body;

    // Validate required fields
    if (!userAnswers || !username || !dept || !num || !quizId || !name) {
      return res.status(400).json({ error: 'Incomplete data provided' });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(username) || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ error: 'Invalid username or quiz ID' });
    }

    // Check for duplicate submission
    const existingResult = await Results.findOne({ username, quizId });
    if (existingResult) {
      return res.status(400).json({ error: 'User has already submitted this quiz' });
    }

    // Fetch quiz questions
    const quizData = await Questions.findById(quizId);
    if (!quizData || !quizData.questions || !quizData.answers) {
      return res.status(400).json({ error: 'Quiz not found or invalid' });
    }

    // Calculate score
    const points = calculatePoints(userAnswers, quizData.answers);
    const scorePercentage = (points / quizData.questions.length) * 100;

    // Create new result
    const newResult = await Results.create({
      username,
      result: userAnswers,
      dept,
      num,
      points,
      quizId,
      name,
      title,
      scorePercentage,
      attempts: userAnswers.length,
    });

    // Prepare response
    res.status(201).json({
      message: 'Result stored successfully',
      result: {
        ...newResult.toObject(),
        totalQuestions: quizData.questions.length,
        correctAnswers: points,
        percentage: scorePercentage,
        title:title,
        wrongQuestions: userAnswers.map((answer, index) => {
          if (answer !== quizData.answers[index]) {
            return {
              question: quizData.questions[index]?.question,
              selectedAnswer: quizData.questions[index]?.options?.[answer] || 'Not answered',
              correctAnswer: quizData.questions[index]?.options?.[quizData.answers[index]],
            };
          }
          return null;
        }).filter((q) => q !== null),
      },
    });
  } catch (error) {
    console.error('Error storing result:', error);
    res.status(500).json({ error: 'Failed to store result' });
  }
};










/** Get all quiz results for a specific user */
exports.getUserResults = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Fetch results for the user
    const userResults = await Results.find({ username: userId });

    if (userResults.length === 0) {
      return res.status(404).json({ message: 'No results found for this user' });
    }

    res.status(200).json(userResults);
  } catch (error) {
    console.error('Error fetching user results:', error);
    res.status(500).json({ error: error.message });
  }
};


/** delete all result */
exports.dropResult = async function (req, res) {
  try {
    await Results.deleteMany();
    res.json({ msg: 'Result Deleted Successfully...!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/** Check if user has completed the latest quiz */
/** Check if user has completed the latest quiz */
exports.checkQuizCompletion = async function (req, res) {
  try {
    const { userId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Get the latest quiz
    const latestQuiz = await Questions.findOne().sort({ createdAt: -1 });
    if (!latestQuiz) {
      return res.status(404).json({ error: "No quiz available" });
    }

    // Check if user has a result for the latest quiz
    const result = await Results.findOne({
      username: userId,
      quizId: latestQuiz._id,
    });
    res.status(200).json({
      hasCompleted: !!result,
      quizId: latestQuiz._id,
      quizTitle: "Mystery Quiz", // Hardcode since model lacks title
    });
  } catch (error) {
    console.error("Error checking quiz completion:", error);
    res.status(500).json({ error: "Failed to check quiz completion" });
  }
};


/** Get all quiz results for a specific user */
exports.getUserResults = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const userResults = await Results.find({
      username: new mongoose.Types.ObjectId(userId),
    });

    // ✅ return even if empty
    res.status(200).json(userResults);

  } catch (error) {
    console.error('Error fetching user results:', error);
    res.status(500).json({ error: error.message });
  }
};
// exports.getUserResults = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // Validate ObjectId
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ error: 'Invalid user ID format' });
//     }

//     // Fetch results for the user
//     const userResults = await Results.find({ username: userId });

//     if (userResults.length === 0) {
//       return res.status(404).json({ message: 'No results found for this user' });
//     }

//     res.status(200).json(userResults);
//   } catch (error) {
//     console.error('Error fetching user results:', error);
//     res.status(500).json({ error: error.message });
//   }
// };
