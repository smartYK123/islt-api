// Like Routes
const router = require("express").Router();
// const likeController = require('../controllers/likeController');
const homeLikeController = require('../controllers/homeLikeController')
router.post('/', homeLikeController.toggleHomeLike);
router.get('/total/:videoId', homeLikeController.getTotalLikes);
router.get('/status/:videoId/:userId', homeLikeController.getLikeStatus);
module.exports = router;