const Programs = require('../models/specialContent'); // Import Classroom model
const QuizResult = require('../models/programQuiz');

// Get program content by ID
exports.getProgramContent = async (req, res) => {
  try {
    const program = await Programs.findById(req.params.programId); // Fetch program by ID

    // Check if the program exists
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    // Send only the timeLimit or other relevant fields
    res.json({
      message: 'Program retrieved successfully',
      data: {
        title: program.title,
        description: program.description,
        image: program.image,
        media: program.media,
        timeLimit: program.timeLimit, // Accessing the timeLimit field
        quiz: program.quiz,
        deptName: program.deptName,
        gender: program.gender,
        designation: program.designation,
        portalIds: program.portalIds, // Updated field to reflect multiple portal IDs
        forAllUsers: program.forAllUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({ error: 'Error fetching program', details: error.message });
  }
};

// Get program content by ID
// exports.getProgramContent = async (req, res) => {
//   try {
//     const program = await Programs.findById(req.params.programId); // Fetch program by ID

//     // Check if the program exists
//     if (!program) {
//       return res.status(404).json({ message: 'Program not found' });
//     }

//     // Send only the timeLimit or other relevant fields
//     res.json({
//       message: 'Program retrieved successfully',
//       data: {
//         title: program.title,
//         description: program.description,
//         image: program.image,
//         media: program.media,
//         timeLimit: program.timeLimit, // Accessing the timeLimit field
//         quiz: program.quiz,
//         deptName: program.deptName,
//         gender: program.gender,
//         designation: program.designation,
//         portalId: program.portalId,
//         forAllUsers: program.forAllUsers,
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching program:', error);
//     res.status(500).json({ error: 'Error fetching program', details: error.message });
//   }
// };
exports.postClassroomContent = async (req, res) => {
  const {
    title,
    description,
    image,
    media,
    quiz,
    deptName,
    gender,
    designation,
    portalIds,
    forAllUsers,
    maritalStatus,
    timeLimit,
  } = req.body;

  try {
    const normalizedPortalIds = Array.isArray(portalIds) ? portalIds : [portalIds];

    const newPrograms = new Programs({
      title,
      description,
      image,
      media,
      quiz,
      maritalStatus,
      deptName,
      gender,
      designation,
      portalIds: normalizedPortalIds,
      forAllUsers,
      timeLimit,
    });

    await newPrograms.save();
    res.status(201).json({ message: 'Content posted successfully', program: newPrograms });
  } catch (error) {
    console.error('Error posting content:', error);
    res.status(400).json({ error: 'Error posting content', details: error.message });
  }
};

// exports.postClassroomContent = async (req, res) => {
//   const { title, description, image, media, quiz, deptName, gender, designation, portalId, forAllUsers, maritalStatus, timeLimit } = req.body;
//   try {
//       const newPrograms = new Programs({
//           title,
//           description,
//           image,
//           media,
//           quiz,
//           maritalStatus,
//           deptName,
//           gender,
//           designation,
//           portalId,
//           forAllUsers,
//           timeLimit
//       });
//       await newPrograms.save();
//       res.status(201).json({ message: 'Content posted successfully', program: newPrograms });
//   } catch (error) {
//       console.error('Error posting content:', error); // Log the exact error to debug
//       res.status(400).json({ error: 'Error posting content', details: error.message });
//   }
// };


// Delete the quiz for a specific course
exports.deleteQuiz = async (req, res) => {
  try {
    // Find the course by ID
    const course = await Programs.findById(req.params.courseId);

    // Check if the course exists
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if the quiz exists for the course
    if (!course.quiz || course.quiz.length === 0) {
      return res.status(404).json({ message: 'No quiz found for this course' });
    }

    // Delete the quiz by setting the quiz array to an empty array
    course.quiz = [];

    // Save the updated course
    await course.save();

    // Respond with success message
    res.json({ message: 'Quiz deleted successfully', course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserQuizResults = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find all quiz results for the user
    const quizResults = await QuizResult.find({ userId });

    if (quizResults.length === 0) {
      return res.status(404).json({ message: 'No quiz results found for this user.' });
    }

    res.json({
      message: 'Quiz results retrieved successfully.',
      quizResults,
    });
  } catch (error) {
    console.error('Error in getUserQuizResults:', error); // Log the error
    res.status(500).json({ error: error.message });
  }
};

// Updated Route to check if the quiz is already completed by a user for Programs
exports.checkQuizCompletion = async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query parameters
    const { courseId } = req.params;

    // Check if there's a QuizResult entry for this user and course
    const quizResult = await QuizResult.findOne({ userId, courseId });

    // If quizResult exists, it means the quiz is completed
    if (quizResult) {
      return res.json({ completed: true });
    } else {
      return res.json({ completed: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get all courses that have a quiz
exports.getCoursesWithQuiz = async (req, res) => {
  try {
    const coursesWithQuiz = await Programs.find({ quiz: { $exists: true, $ne: [] } });

    if (coursesWithQuiz.length === 0) {
      return res.status(404).json({ message: 'No courses with quizzes found' });
    }

    res.json(coursesWithQuiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit quiz for a specific program
exports.submitQuiz = async (req, res) => {
  try {
    const { answers, userId } = req.body; // Get answers and userId from the request body
    const { courseId } = req.params; // Get courseId from the request parameters

    // Check if the user has already submitted a quiz for this program
    const existingResult = await QuizResult.findOne({ userId, courseId });

    let correctAnswers = 0;
    let wrongQuestions = [];

    // Retrieve the program (course) and its quiz
    const program = await Programs.findById(courseId);
    if (!program || !program.quiz) {
      return res.status(404).json({ message: 'Program or quiz not found' });
    }

    // Calculate correct answers and wrong questions
    program.quiz.forEach((question) => {
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

    const totalQuestions = program.quiz.length;
    const percentage = (correctAnswers / totalQuestions) * 100;

    if (existingResult) {
      // If a previous result exists, return the result without saving it again
      return res.json({
        message: 'You have already submitted this quiz.',
        totalQuestions,
        correctAnswers,
        wrongQuestions,
        percentage,
        firstAttempt: false, // Indicate that this is not the first attempt
      });
    }

    // Save the result (only if no previous submission exists)
    const quizResult = new QuizResult({
      userId,
      courseId: program._id, // Reference to the program
      correctAnswers,
      totalQuestions,
      percentage,
    });

    await quizResult.save();

    res.json({
      message: 'Quiz submitted successfully.',
      totalQuestions,
      correctAnswers,
      wrongQuestions,
      percentage,
      firstAttempt: true, // Indicate that this is the first attempt
    });
  } catch (error) {
    console.error('Error in submitQuiz:', error); // Log the error
    res.status(500).json({ error: error.message });
  }
};
// Get all courses that have a quiz
exports.getClassroomWithQuiz = async (req, res) => {
    try {
      const coursesWithQuiz = await Programs.find({ quiz: { $exists: true, $ne: [] } });
  
      if (coursesWithQuiz.length === 0) {
        return res.status(404).json({ message: 'No courses with quizzes found' });
      }
  
      res.json(coursesWithQuiz);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

// GET content and quiz based on acceptance of the event
exports.getAcceptedClassroomContent = async (req, res) => {
  const { userId, portalId, deptName, gender, designation } = req.query;

  try {
    let filter = {
      $or: [
        { forAllUsers: true },
        { portalIds: portalId }, // Match if `portalId` is in `portalIds`
        { deptName: deptName },
        { gender: gender },
        { designation: designation },
      ],
      acceptedBy: userId, // Ensure the user has accepted the associated event
    };

    const programs = await Programs.find(filter);
    res.status(200).json(programs);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching content', details: error.message });
  }
};

// exports.getAcceptedClassroomContent = async (req, res) => {
//     const { userId, portalId, deptName, gender, designation } = req.query;

//     try {
//         let filter = {
//             $or: [
//                 { forAllUsers: true },        // Content for all users
//                 { portalId: portalId },       // Content for a specific user by portalId
//                 { deptName: deptName },       // Content for a specific department
//                 { gender: gender },           // Content based on gender
//                 { designation: designation }  // Content based on designation
//             ],
//             acceptedBy: userId // Ensure the user has accepted the associated event
//         };

//         const programs = await Programs.find(filter);
//         res.status(200).json(programs);
//     } catch (error) {
//         res.status(400).json({ error: 'Error fetching content' });
//     }
// };

exports.getAcceptedProgramContent = async (req, res) => {
    const { userId } = req.query;

    try {
        let filter = {
            acceptedBy: userId  // Fetch only programs accepted by the user
        };

        const programs = await Programs.find(filter);
        res.status(200).json(programs);
    } catch (error) {
        res.status(400).json({ error: 'Error fetching accepted programs' });
    }
};



// DELETE content by ID
exports.deleteClassroomContent = async (req, res) => {
    const { contentId } = req.params;

    try {
        await Programs.findByIdAndDelete(contentId);
        res.status(200).json({ message: 'Content deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Error deleting content' });
    }
};
