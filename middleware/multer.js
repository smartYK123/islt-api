const multer = require('multer')

const storage = multer.diskStorage({})

const fileFilter =(req, file, cb) =>{
    console.log(file)
    if(!file.mimetype.includes('image')){
        return cb('Invalid Image Format!', false)
    }
    cb(null, true)
}
module.exports = multer({storage, fileFilter})