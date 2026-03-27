// controllers/commentController.js
// const Comment = require('../models/Comment');
const Comment = require("../models/comments")
exports.createComment = async (req, res) => {
  try {
    const { postId, userId, text,name,picture,department } = req.body;
    const comment = await Comment.create({ postId, userId, text,name,picture,department });
    res.status(201).json({ comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// exports.getCommentsByPostId = async (req, res) => {
//   try {
//     const postId = req.params.postId;
//     // const comments = await Comment.find({ postId });
//     const comments = await Comment.find({postId }).sort({ createdAt: -1 }); // Sort by createdAt in descending order

//     res.status(200).json({ comments });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
// Fetch all comments with ADMIN comments always on top
exports.getCommentsByPostId = async (req, res) => {
  try {
    const postId = req.params.postId;

    // Fetch admin comments first (sorted by latest first)
    const adminComments = await Comment.find({ postId, department: "ADMIN" }).sort({ createdAt: -1 });

    // Fetch other comments (sorted by latest first)
    const otherComments = await Comment.find({ postId, department: { $ne: "ADMIN" } }).sort({ createdAt: -1 });

    // Merge admin comments on top of other comments
    const comments = [...adminComments, ...otherComments];

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getTotalCommentNumber = async (req, res) => {
  try {
    const postId = req.params.postId;
    const totalComments = await Comment.countDocuments({ postId });
    res.status(200).json({ totalComments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Function to delete a comment
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

// exports.likeComment = async (req, res) => {
//     try {
//       const { commentId } = req.params;
//       const { userId } = req.body;
  
//       const comment = await Comment.findById(commentId);
  
//       if (!comment) {
//         return res.status(404).json({ message: 'Comment not found' });
//       }
  
//       const index = comment.likes.indexOf(userId);
//       if (index === -1) {
//         // User has not liked the comment yet, add like
//         comment.likes.push(userId);
//       } else {
//         // User has already liked the comment, remove like
//         comment.likes.splice(index, 1);
//       }
  
//       await comment.save();
  
//       res.status(200).json({ message: 'Like updated successfully', likes: comment.likes.length });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   };
  