// routes/dailyQuoteRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDailyQuote,
  createDailyQuote,
  getAllQuotes,
} = require('../controllers/dailyQuoteController');

// Public endpoint - frontend calls this to get today's quote
router.get('/daily', getDailyQuote);

// Admin routes (add auth middleware later: protect, authorize('admin'))
router.post('/', createDailyQuote);
router.get('/admin/all', getAllQuotes);

module.exports = router;