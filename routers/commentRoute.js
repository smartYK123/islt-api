
const router = require("express").Router();
// const commentController = require('../controllers/commentController');
const commentController = require("../controllers/commentController")
router.post('/', commentController.createComment);
router.get('/:postId', commentController.getCommentsByPostId);
router.get("/total/:postId", commentController.getTotalCommentNumber);
router.delete('/',  commentController.deleteComment);
module.exports = router;
