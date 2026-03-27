// // controller.js
// const WarRoom = require('../models/warRoom');
// const Comment = require('../models/Comment');

// async function addComment(req, res) {
//   try {
//     const { postId } = req.params;
//     const { userId, commentText,name,picture,department } = req.body;
//     // postId, userId, text,name,picture,department
//     const post = await WarRoom.findById(postId);
//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' });
//     }

//     const comment = new Comment({
//       user: userId,
//       text: commentText,
//       post: postId,
//       name,
//       picture,
//       department
//     });

//     await comment.save();

//     post.comments.push(comment._id);
//     await post.save();

//     res.status(201).json({ message: 'Comment added successfully', comment });
//   } catch (error) {
//     console.error('Error adding comment:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }

// async function toggleLike(req, res) {
//   try {
//     const { postId } = req.params;
//     const { userId } = req.body;

//     const post = await WarRoom.findById(postId);
//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' });
//     }

//     const isLiked = post.likes.includes(userId);

//     if (isLiked) {
//       post.likes = post.likes.filter(id => id.toString() !== userId);
//     } else {
//       post.likes.push(userId);
//     }

//     const totalLikes = post.likes.length; // Get total likes count

//     await post.save();

//     res.status(200).json({ message: 'Like updated successfully', liked: !isLiked });
//   } catch (error) {
//     console.error('Error updating like:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }
// async function getTotalLikes(req, res) {
//   try {
//     const { postId } = req.params;

//     const post = await WarRoom.findById(postId);
//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' });
//     }

//     const totalLikes = post.likes.length; // Get total likes count

//     res.status(200).json({ totalLikes });
//   } catch (error) {
//     console.error('Error fetching total likes:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }

// async function getComments(req, res) {
//   try {
//     const { postId } = req.params;

//     const post = await WarRoom.findById(postId);
//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' });
//     }

//     const comments = await Comment.find({ post: postId });

//     res.status(200).json({ comments });
//   } catch (error) {
//     console.error('Error fetching comments:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }

// module.exports = { addComment, toggleLike, getComments ,getTotalLikes};
// const WarLike = require('../models/warLike');
// const WarRoom = require('../models/warRoom');
// const Comment = require('../models/comment');
// // controller.js
const WarRoom = require("../models/warRoom");
const Comment = require("../models/Comment");
const WarLike = require("../models/warLike");
// Toggle like
exports.toggleLike = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  try {
    let like = await WarLike.findOne({ userId, postId });
    if (like) {
      like.liked = !like.liked;
    } else {
      like = new WarLike({ userId, postId, liked: true });
    }
    await like.save();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ success: false, message: "Failed to toggle like" });
  }
};

// Get total likes
exports.getTotalLikes = async (req, res) => {
  const { postId } = req.params;

  try {
    const totalLikes = await WarLike.countDocuments({ postId, liked: true });
    res.status(200).json({ totalLikes });
  } catch (error) {
    console.error("Error getting total likes:", error);
    res.status(500).json({ message: "Failed to get total likes" });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  const { postId } = req.params;
  const { user, commentText, name, picture, department } = req.body;

  try {
    const comment = new Comment({
      user,
      text: commentText,
      post: postId,
      name,
      picture,
      department,
    });
    await comment.save();
    // Update the post's comments array
    await WarRoom.findByIdAndUpdate(postId, {
      $push: { comments: comment._id },
    });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

// Get comments
exports.getComments = async (req, res) => {
  const { postId } = req.params;

  try {
    // const comments = await Comment.find({postId }).sort({ createdAt: -1 }); // Sort by createdAt in descending order

    const comments = await Comment.find({ post: postId }).populate("user").sort({ createdAt: -1 });
    res.status(200).json({ comments });
  } catch (error) {
    console.error("Error getting comments:", error);
    res.status(500).json({ message: "Failed to get comments" });
  }
};
// Function to delete a comment
// Delete comment

exports.deleteComment = async (req, res) => {
  const {postId } = req.params;
  const { userId } = req.body; // Assuming the userId is sent in the body

  try {
    // Find the comment
    const comment = await Comment.findById(postId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Check if the user is the owner of the comment
    if (!postId || !userId) {
      return res.status(400).json({ error: "Comment ID and User ID are required" });
    }

    // Remove the comment ID from the WarRoom's comments array
    await WarRoom.findByIdAndUpdate(comment.post, {
      $pull: { comments: postId },
    });

    // Delete the comment
    await Comment.findByIdAndDelete(postId);

    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, message: "Failed to delete comment" });
  }
};
