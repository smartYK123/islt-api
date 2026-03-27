// // router.js
// const express = require('express');
// const router = express.Router();
// const { addComment, toggleLike,getComments,getTotalLikes } = require('../controllers/warRoomComment');

// router.post('/warroom/:postId/comments', addComment);
// router.post('/warroom/:postId/like', toggleLike);
// router.get('/warroom/:postId/comments', getComments);
// router.get('/warroom/:postId/like', getTotalLikes);


// module.exports = router;
const express = require('express');
const router = express.Router();
const warRoomController = require('../controllers/warRoomComment');

// Routes for likes
router.post('/warroom/like/:postId', warRoomController.toggleLike);
router.get('/warroom/like/:postId/count', warRoomController.getTotalLikes);

// Routes for comments
router.post('/warroom/comment/:postId', warRoomController.addComment);
router.get('/warroom/comment/:postId', warRoomController.getComments);
// router.delete('/warroom/comment/:postId', warRoomController.deleteComment);
router.delete('/comments/:postId', warRoomController.deleteComment);
module.exports = router;

