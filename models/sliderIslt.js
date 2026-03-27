// models/SliderItem.js
const mongoose = require('mongoose');

const SliderIsltSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  navigationRoute: { type: String }, // 
  isForSlider: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model('SliderIslt', SliderIsltSchema);
