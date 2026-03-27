const QuizResult = require('../models/quizResult');
const Plenary = require('../models/plenary'); // Replace with your actual course model

exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    const { userId } = req.user; // Assuming you're using some form of authentication middleware
    const course = await Plenary.findById(req.params.courseId);

    if (!course || !course.quiz) {
      return res.status(404).json({ message: 'Course or quiz not found' });
    }

    let correctAnswers = 0;
    let wrongQuestions = [];

    course.quiz.forEach((question, index) => {
      if (answers[question._id] === question.correctAnswer) {
        correctAnswers++;
      } else {
        wrongQuestions.push({
          question: question.question,
          correctAnswer: question.correctAnswer,
          selectedAnswer: answers[question._id],
        });
      }
    });

    const totalQuestions = course.quiz.length;
    const percentage = (correctAnswers / totalQuestions) * 100;

    // Save the result
    const quizResult = new QuizResult({
      userId,
      courseId: course._id,
      correctAnswers,
      totalQuestions,
      percentage,
    });

    await quizResult.save();

    res.json({
      totalQuestions,
      correctAnswers,
      wrongQuestions,
      percentage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Route to check if the quiz is already completed by a user
exports.checkQuizCompletion = async (req, res) => {
  try {
    const { userId } = req.user;
    const { courseId } = req.params;

    const quizResult = await QuizResult.findOne({ userId, courseId });

    if (quizResult) {
      return res.json({ completed: true, quizResult });
    } else {
      return res.json({ completed: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
