// routes/sliderRoutes.js
const express = require('express');
const router = express.Router();
const sliderController = require('../controllers/sliderIsltController');

// Get all items
router.get('/', sliderController.getAllItems);

// Create a new item
router.post('/', sliderController.createItemislt);

// Update an item
router.put('/:id', sliderController.updateItem);

// Delete an item
router.delete('/:id', sliderController.deleteItem);

module.exports = router;
