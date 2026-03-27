// Like Controller
const { Like } = require("../models/player")
exports.toggleHomeLike = async (req, res) => {
    try {
      const { videoId, userId } = req.body;
      let like = await Like.findOne({ videoId, userId });
      if (like) {
        await Like.findByIdAndDelete(like._id);
        res.json({ message: 'Like removed successfully' });
      } else {
        like = new Like({ videoId, userId });
        await like.save();
        res.json({ message: 'Like added successfully' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  };

  exports.getTotalLikes = async (req, res) => {
    try {
      const { videoId } = req.params;
      const totalLikes = await Like.countDocuments({ videoId });
      res.json({ totalLikes });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  exports.getLikeStatus = async (req, res) => {
    try {
      const { videoId, userId } = req.params;
      const like = await Like.findOne({ videoId, userId });
      res.json({ hasLiked: !!like });
    } catch (error) {
      console.error("Error fetching like status:", error);
      res.status(500).json({ error: "Server error" });
    }
  };