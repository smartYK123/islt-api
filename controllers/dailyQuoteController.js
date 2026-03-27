// controllers/dailyQuoteController.js
const DailyQuote = require('../models/DailyQuote');

// Get the quote to display today (most recent active one or random)
exports.getDailyQuote = async (req, res) => {
  try {
    // Option 1: Get the most recent active quote
    let quote = await DailyQuote.findOne({ isActive: true })
      .sort({ displayDate: -1 })
      .select('quote reference authorOrSection');

    // Option 2: If you prefer random active quote (uncomment if desired)
    // const count = await DailyQuote.countDocuments({ isActive: true });
    // const random = Math.floor(Math.random() * count);
    // let quote = await DailyQuote.findOne({ isActive: true }).skip(random).select('quote reference authorOrSection');

    if (!quote) {
      // Fallback quote if none found
      quote = {
        quote: 'Commit thy works unto the LORD, and thy thoughts shall be established.',
        reference: 'Proverbs 16:3',
        authorOrSection: 'Leadership nuggets',
      };
    }

    res.status(200).json(quote);
  } catch (error) {
    console.error('Error fetching daily quote:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new quote (admin only)
exports.createDailyQuote = async (req, res) => {
  try {
    const { quote, reference, authorOrSection, isActive = true } = req.body;

    if (!quote || !reference) {
      return res.status(400).json({ message: 'Quote and reference are required' });
    }

    const newQuote = await DailyQuote.create({
      quote,
      reference,
      authorOrSection: authorOrSection || 'Leadership Corner',
      isActive,
      displayDate: new Date(),
      // createdBy: req.user._id, // if you add auth middleware later
    });

    res.status(201).json({
      success: true,
      data: newQuote,
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create quote', error: error.message });
  }
};

// Optional: Get all quotes (for admin panel)
exports.getAllQuotes = async (req, res) => {
  try {
    const quotes = await DailyQuote.find().sort({ displayDate: -1 });
    res.status(200).json(quotes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};