// likeRoutes.js

const router = require("express").Router();

const likeController = require('../controllers/likeController');

router.post('/', likeController.toggleLike); // Route to like a comment
// router.delete('/unlike', likeController.unlikePost); // Route to unlike a comment
router.get('/:postId', likeController.getTotalLikes);
router.get('/status/:postId/:userId', likeController.getLikeStatus);
module.exports = router;
