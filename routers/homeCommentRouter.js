// Comment Routes
const router = require("express").Router();
const homeCommentController = require('../controllers/homeCommentController');

router.post('/', homeCommentController.postComment);
router.get('/total/:videoId', homeCommentController.getTotalComments);
router.get('/:videoId', homeCommentController.getAllComments);
// Delete a comment by ID
router.delete('/', homeCommentController.deleteComment);

// Edit a comment by ID
router.put('/', homeCommentController.editComment);


module.exports = router;