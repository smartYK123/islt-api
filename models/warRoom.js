
// WarRoom model (WarRoom.js)
const mongoose = require('mongoose');

const warRoomSchema = new mongoose.Schema({
    imageUrls: [String],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    prayerdate:String,
    prayertitle:String,
    prayer: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'warLike' }], // Assuming you have a User model for users who like the post
});

const WarRoom = mongoose.model('WarRoom', warRoomSchema);

module.exports = WarRoom;
