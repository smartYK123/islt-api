
const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.get("/", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Token missing" });

  const user = await User.findOne({ "kc_token": token });
  if (!user) return res.status(404).json({ error: "Invalid token" });

  // Invalidate token after first use
  user.kc_token = null;
  await user.save();

  res.json({
    _id: user._id.toString(), // 🔥 ADD THIS
    kc_id: user.kc_id,
    username: user.username,
    name: user.name,
    phone: user.phone,
    email: user.email,
    image: user.image,
    menteeCode: user.menteeCode, // important
    faculty:user.faculty
  });
});

module.exports = router;

