// controllers/pinnedNoticesController.js
const PinnedNotices = require('../models/pinned');


exports.createNotice = async (req, res) => {
    try {
      const { notices } = req.body;
      const newNotices = await PinnedNotices.create({ notices });
      res.status(201).json({ newNotices });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  exports.getNotices = async (req, res) => {
    try {
      const notices = await PinnedNotices.find();
      res.status(200).json({ notices });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
// Update a specific notice
exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, scheduledTime } = req.body;

    const notice = await PinnedNotices.findOneAndUpdate(
      { "notices._id": id },
      {
        $set: {
          "notices.$.message": message,
          "notices.$.scheduledTime": scheduledTime,
        },
      },
      { new: true }
    );

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.status(200).json({ notice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// controllers/pinnedNoticesController.js
// Delete a specific notice
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await PinnedNotices.findOneAndUpdate(
      { "notices._id": id },
      {
        $pull: { notices: { _id: id } },
      },
      { new: true }
    );

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
