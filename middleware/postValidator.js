const { check, validationResult } = require("express-validator");

exports.postValidator = [
  check("name").trim().not().isEmpty().withMessage("Post name is Empty"),
  check("email")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Post email is Empty"),
    check("phone").trim().not().isEmpty().withMessage("Phone number is Empty"),
    check("role").trim().not().isEmpty().withMessage("Role number is Empty"),

];

exports.validate = (req, res,next)=>{
    const error = validationResult(req).array();
    if(error.length){
        return res.status(401).json({error: error[0].msg})
    }
    next();
}