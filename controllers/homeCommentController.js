const { Comment } = require("../models/player")
exports.postComment = async (req, res) => {
    try {
      const { videoId, userId, text,name,picture,department  } = req.body;
      const comment = new Comment({ videoId, userId, text,name,picture,department  });
      await comment.save();
      res.json({ message: 'Comment added successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  };

  exports.getTotalComments = async (req, res) => {
    try {
      const { videoId } = req.params;
      const totalComments = await Comment.countDocuments({ videoId });
      res.json({ totalComments });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // exports.getAllComments = async (req, res) => {
  //   try {
  //     const { videoId } = req.params;
  //     const comments = await Comment.find({ videoId }).sort({ createdAt: -1 }); // Sort by createdAt in descending order
  //     res.json({ comments });
  //   } catch (error) {
  //     res.status(500).json({ error: error.message });
  //   }
  // };
  exports.getAllComments = async (req, res) => {
    try {
      const { videoId } = req.params;
  
      // Fetch Admin comments separately
      const adminComments = await Comment.find({ videoId, department: "ADMIN" }).sort({ createdAt: -1 });
  
      // Fetch other comments separately
      const otherComments = await Comment.find({ videoId, department: { $ne: "ADMIN" } }).sort({ createdAt: -1 });
  
      // Merge admin comments on top of other comments
      const comments = [...adminComments, ...otherComments];
  
      res.json({ comments });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  
  exports.deleteComment = async (req, res) => {
    try {
      const { commentId, userId } = req.body;
  
      // Ensure commentId and userId are provided
      if (!commentId || !userId) {
        return res.status(400).json({ error: "Comment ID and User ID are required" });
      }
  
      // Find the comment by ID and ensure it belongs to the user
      const comment = await Comment.findOneAndDelete({ _id: commentId, userId: userId });
  
      // If the comment does not exist or does not belong to the user
      if (!comment) {
        return res.status(404).json({ error: "Comment not found or you do not have permission to delete this comment" });
      }
  
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  };
  
  exports.editComment = async (req, res) => {
    try {
      const { commentId, userId, newText } = req.body;
  
      // Ensure commentId, userId, and newText are provided
      if (!commentId || !userId || !newText) {
        return res.status(400).json({ error: "Comment ID, User ID, and New Text are required" });
      }
  
      // Find the comment by ID and ensure it belongs to the user
      const comment = await Comment.findOneAndUpdate(
        { _id: commentId, userId: userId },
        { text: newText },
      );
  
      // If the comment does not exist or does not belong to the user
      if (!comment) {
        return res.status(404).json({ error: "Comment not found or you do not have permission to edit this comment" });
      }
  
      res.status(200).json({ message: "Comment edited successfully", comment });
    } catch (error) {
      console.error("Error editing comment:", error);
      res.status(500).json({ error: "Failed to edit comment" });
    }
  };
  
  // .populate('userId', 'name'); // Assuming user model has a 'name' field