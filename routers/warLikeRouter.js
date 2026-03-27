// likeRoutes.js

const router = require("express").Router();

const warLikeController = require('../controllers/warLikeControlller');

router.post('/', warLikeController.toggleLike); // Route to like a comment
// router.delete('/unlike', likeController.unlikePost); // Route to unlike a comment
router.get('/:postId', warLikeController.getTotalLikes);

module.exports = router;