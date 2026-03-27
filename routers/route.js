const express = require('express');
const router = express.Router();

const controller = require("../controllers/controller.js");
// router.post('/result', controller.storeResult);

/** Questions Routes API */
router
  .route("/questions")
  .get(controller.getQuestions) /** GET Request */
  .post(controller.insertQuestions) /** POST Request */
  .delete(controller.dropQuestions); /** DELETE Request */

router
  .route("/result")
  .get(controller.getResult)
  .post(controller.storeResult)
  .delete(controller.dropResult)  
  router
  .route("/results/user/:userId")
  .get(controller.getUserResults);
router
 .route("/check-quiz-completion")
 .post(controller.checkQuizCompletion)
module.exports = router;

