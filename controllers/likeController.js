const Like = require("../models/like")
exports.toggleLike = async (req, res) => {
    try {
      const { userId, postId } = req.body;
  
      // Find the like for the user and post
      let like = await Like.findOne({ userId, postId });
  
      if (!like) {
        // If like doesn't exist, create a new one
        like = new Like({ userId, postId, liked: true });
        await like.save();
      } else {
        // If like exists, toggle the liked status
        like.liked = !like.liked;
        await like.save();
      }
  
      // Get the total like count for the post
      const totalLikes = await Like.countDocuments({ postId, liked: true });
  
      res.status(200).json({ liked: like.liked, totalLikes });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  exports.getTotalLikes = async (req, res) => {
    try {
      const postId = req.params.postId;
      const totalLikes = await Like.countDocuments({ postId, liked: true });
      res.status(200).json({ totalLikes });
      console.log(totalLikes)
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  exports.getLikeStatus = async (req, res) => {
    try {
      const { postId, userId } = req.params;
      const like = await Like.findOne({ postId, userId });
      res.json({ hasLiked: !!like });
    } catch (error) {
      console.error("Error fetching like status:", error);
      res.status(500).json({ error: "Server error" });
    }
  };