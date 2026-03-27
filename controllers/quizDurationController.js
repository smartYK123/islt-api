const QuizDuration = require('../models/quizDuration');

// POST: Create or update a quiz duration
exports.createQuizDuration = async (req, res) => {
    try {
        const { time, makelive, questions, id,title } = req.body;

        // Validate required fields
        if (time === undefined || questions === undefined) {
            return res.status(400).json({ message: 'Time and questions are required' });
        }

        if (id) {
            // Update existing quiz duration
            const updatedQuizDuration = await QuizDuration.findByIdAndUpdate(
                id,
                { time, makelive: makelive || false, questions },
                { new: true, runValidators: true }
            );
            if (!updatedQuizDuration) {
                return res.status(404).json({ message: 'Quiz duration not found' });
            }
            return res.status(200).json(updatedQuizDuration);
        }

        // Create new quiz duration
        const quizDuration = new QuizDuration({
            time,
            makelive: makelive || false,
            questions,
            title
        });
        await quizDuration.save();
        res.status(201).json(quizDuration);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET: Retrieve a quiz duration by ID or all makelive durations
exports.getQuizDuration = async (req, res) => {
    try {
        const { id } = req.params;

        if (id) {
            // Fetch by ID
            const quizDuration = await QuizDuration.findById(id);
            if (!quizDuration) {
                return res.status(404).json({ message: 'Quiz duration not found' });
            }
            return res.status(200).json(quizDuration);
        }

        // Fetch all makelive durations
        const quizDurations = await QuizDuration.find({ makelive: true });
        res.status(200).json(quizDurations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};