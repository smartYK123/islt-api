// models/DailyQuote.js
const mongoose = require('mongoose');

const dailyQuoteSchema = new mongoose.Schema(
  {
    quote: {
      type: String,
      required: [true, 'Quote text is required'],
      trim: true,
      minlength: [10, 'Quote must be at least 10 characters'],
    },
    reference: {
      type: String,
      required: [true, 'Bible reference is required'],
      trim: true,
      example: 'Proverbs 16:3',
    },
    authorOrSection: {
      type: String,
      default: 'Leadership nuggets',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // if you have user auth later
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster daily query
dailyQuoteSchema.index({ isActive: 1, displayDate: -1 });

module.exports = mongoose.model('DailyQuote', dailyQuoteSchema);