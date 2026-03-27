// controllers/sliderController.js
const Sliderislt = require('../models/sliderIslt');



// Get all items or filter by isForSlider
exports.getAllItems = async (req, res) => {
    const { isForSlider } = req.query;  // Capture the isForSlider query parameter
  
    try {
      let query = {};
      if (isForSlider !== undefined) {
        query.isForSlider = isForSlider === 'true';  // Convert the string to a boolean
      }
      const items = await Sliderislt.find(query);
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
// Create a new item
exports.createItemislt = async (req, res) => {
  const { title, description, image, category, isForSlider,navigationRoute } = req.body;

  const item = new Sliderislt({
    title,
    description,
    image,
    category,
    isForSlider,
    navigationRoute
  });

  try {
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update an item
exports.updateItem = async (req, res) => {
  const { title, description, image, category, isForSlider,navigationRoute } = req.body;

  try {
    const item = await Sliderislt.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.title = title ?? item.title;
    item.description = description ?? item.description;
    item.image = image ?? item.image;
    item.category = category ?? item.category;
    item.isForSlider = isForSlider ?? item.isForSlider;
    item.navigationRoute = navigationRoute ?? item.navigationRoute;
    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Sliderislt.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.remove();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};













// // controllers/sliderController.js
// const Slider = require('../models/Slider');

// // Get all slider items
// exports.getAllSliders = async (req, res) => {
//   try {
//     const sliders = await Slider.find();
//     res.status(200).json(sliders);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching slider data' });
//   }
// };

// // Create a new slider item
// exports.createSlider = async (req, res) => {
//   const { title, description, image, category, navigationRoute } = req.body;

//   try {
//     const newSlider = new Slider({ title, description, image, category, navigationRoute });
//     await newSlider.save();
//     res.status(201).json(newSlider);
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating slider' });
//   }
// };

// // Update an existing slider
// exports.updateSlider = async (req, res) => {
//   const { id } = req.params;
//   const { title, description, image, category, navigationRoute } = req.body;

//   try {
//     const updatedSlider = await Slider.findByIdAndUpdate(
//       id,
//       { title, description, image, category, navigationRoute },
//       { new: true }
//     );

//     if (!updatedSlider) {
//       return res.status(404).json({ message: 'Slider not found' });
//     }

//     res.status(200).json(updatedSlider);
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating slider' });
//   }
// };
