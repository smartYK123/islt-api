const express = require("express");
const router = express.Router();

const User = require("../models/user");
const MenteeCode = require("../models/menteeCode");





/* ============================= */
/*     CREATE MENTEE CODE        */
/* ============================= */
router.post("/mentee-code", async (req, res) => {
  try {
    const { code, faculty } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check if already exists
    const existing = await MenteeCode.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({ error: "Code already exists" });
    }

    const newCode = new MenteeCode({
      code: normalizedCode,
      faculty: faculty || null,
    });

    await newCode.save();

    res.status(201).json({
      success: true,
      data: newCode,
    });
  } catch (err) {
    console.error("Create mentee code error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


/* ============================= */
/*     UPDATE MENTEE CODE        */
/* ============================= */
router.put("/mentee-code/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { code, faculty, used } = req.body;

    const updateData = {};

    if (code) updateData.code = code.trim().toUpperCase();
    if (faculty !== undefined) updateData.faculty = faculty;
    if (used !== undefined) updateData.used = used;

    const updated = await MenteeCode.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Mentee code not found" });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("Update mentee code error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


/* ============================= */
/*     GET ALL CODES             */
/* ============================= */
router.get("/mentee-code", async (req, res) => {
  try {
    const codes = await MenteeCode.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ============================= */
/*     DELETE CODE               */
/* ============================= */
router.delete("/mentee-code/:id", async (req, res) => {
  try {
    const deleted = await MenteeCode.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Code not found" });
    }

    res.json({ success: true, message: "Code deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/verify-mentee", async (req, res) => {
  try {
    const { token, menteeCode } = req.body;

    if (!token || !menteeCode) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const user = await User.findOne({ kc_id: token });
    if (!user) return res.status(404).json({ error: "Invalid token" });

    const normalizedCode = menteeCode.trim().toUpperCase();

    const codeDoc = await MenteeCode.findOne({ code: normalizedCode });

    if (!codeDoc) {
      return res.status(400).json({ error: "Invalid mentee code" });
    }

    // ✅ 🔥 CASE 1: CODE USED BY SAME USER → ALLOW
    if (codeDoc.used && String(codeDoc.usedBy) === String(user._id)) {
      return res.json({
        success: true,
        message: "Code already verified",
        user,
      });
    }

    // ❌ CASE 2: CODE USED BY ANOTHER USER → BLOCK
    // if (codeDoc.used && String(codeDoc.usedBy) !== String(user._id)) {
    //   return res.status(400).json({ error: "Code already used" });
    // }

    // ✅ ASSIGN CODE
    user.menteeCode = normalizedCode;

    // ✅ ASSIGN FACULTY IF EXISTS
    if (codeDoc.faculty) {
      user.faculty = codeDoc.faculty;
    }

    await user.save();

    // ✅ MARK CODE USED + WHO USED IT
    codeDoc.used = true;
    codeDoc.usedBy = user._id;
    await codeDoc.save();

    res.json({
      success: true,
      user,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// router.post("/verify-mentee", async (req, res) => {
//   try {
//     const { token, menteeCode } = req.body;

//     if (!token || !menteeCode) {
//       return res.status(400).json({ error: "Missing fields" });
//     }

//     const user = await User.findOne({ kc_id: token });
//     if (!user) return res.status(404).json({ error: "Invalid token" });

//     // ✅ 🔥 STEP 1: USER ALREADY VERIFIED → SKIP EVERYTHING
//     if (user.menteeCode) {
//       return res.json({
//         success: true,
//         user: {
//           _id: user._id.toString(), // 🔥 ADD THIS
//           kc_id: user.kc_id,
//           username: user.username,
//           name: user.name,
//           phone: user.phone,
//           email: user.email,
//           image: user.image,
//           menteeCode: user.menteeCode,
//         },
//       });
//     }

//     const normalizedCode = menteeCode.trim().toUpperCase();

//     const codeDoc = await MenteeCode.findOne({
//       code: normalizedCode,
//     });

//     if (!codeDoc) {
//       return res.status(400).json({ error: "Invalid mentee code" });
//     }

//     // ✅ 🔥 STEP 2: CHECK IF CODE USED BY ANOTHER USER
//     if (codeDoc.used) {
//       return res.status(400).json({ error: "Code already used" });
//     }

//     // ✅ SAVE CODE
//     user.menteeCode = normalizedCode;
//     await user.save();

//     // ✅ MARK CODE USED
//     codeDoc.used = true;
//     await codeDoc.save();

//     res.json({
//       success: true,
//       user: {
//         kc_id: user.kc_id,
//         username: user.username,
//         name: user.name,
//         phone: user.phone,
//         email: user.email,
//         image: user.image,
//         menteeCode: user.menteeCode,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });
module.exports = router;