// const { Like } = require("../models/player")
// const Like = require("../models/warLike")

// exports.toggleLike = async (req, res) => {
//     try {
//       const { userId} = req.body;
//       const { postId } = req.params;
//       // Find the like for the user and post
//       let like = await Like.findOne({ userId, postId });
  
//       if (!like) {
//         // If like doesn't exist, create a new one
//         like = new Like({ userId, postId, liked: true });
//         await like.save();
//       } else {
//         // If like exists, toggle the liked status
//         like.liked = !like.liked;
//         await like.save();
//       }
  
//       // Get the total like count for the post
//       const totalLikes = await Like.countDocuments({ postId, liked: true });
  
//       res.status(200).json({ liked: like.liked, totalLikes });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   };


const Like = require("../models/warLike");

exports.toggleLike = async (req, res) => {
  try {
    const { userId } = req.body;
    const { postId } = req.params;
    if (!postId) {
        return res.status(400).json({ error: 'postId is required' });
    }
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


//   exports.getTotalLikes = async (req, res) => {
//     try {
//         const { postId } = req.params;
//       const totalLikes = await Like.countDocuments({ postId, liked: true });
//       res.status(200).json({ totalLikes });
//       console.log(totalLikes)
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   };
// Add null check for postId in getTotalLikes controller
exports.getTotalLikes = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!postId) {
            return res.status(400).json({ error: 'postId is required' });
        }
        const totalLikes = await Like.countDocuments({ postId, liked: true });
        res.status(200).json({ totalLikes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


