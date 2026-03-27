
const FaithProclaim = require('../models/trainingVideo1');
const DailyChallenge = require('../models/dailyCbChallenge');
const mongoose = require('mongoose');
const User = require("../models/user");

exports.createTrainingVideo = async (req, res) => {
  try {
    const {
      id,
      user,
      title,
      image,
      media,
      description,
      faculties // 🔥 comes from frontend
    } = req.body;

    const newVideo = new FaithProclaim({
      id,
      user,
      title,
      image,
      media,
      description,
      faculties: faculties && faculties.length > 0 ? faculties : ["ALL"],
    });

    await newVideo.save();

    res.status(201).json(newVideo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.getTrainingVideos = async (req, res) => {
  try {
    const { userId } = req.query;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userFaculty = user.faculty;

    const videos = await FaithProclaim.find({
      $or: [
        { faculties: "ALL" }, // visible to all
        { faculties: userFaculty }, // match user's faculty
      ],
    }).sort({ createdAt: -1 });

    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getTrainingVideoProgress = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // ✅ 1. Get user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userFaculty = user.faculty;

    // ✅ 2. Get ONLY videos user can access
    const videos = await FaithProclaim.find({
      $or: [
        { faculties: "ALL" },
        { faculties: userFaculty },
      ],
    });

    const totalVideos = videos.length;

    let completedCount = 0;

    // ✅ 3. Count ONLY user's completed videos
    videos.forEach((video) => {
      const userProgress = video.watchProgress?.find(
        (wp) =>
          wp.userId?.toString() === userId &&
          wp.completed === true
      );

      if (userProgress) {
        completedCount++;
      }
    });

    const overallProgress =
      totalVideos === 0
        ? 0
        : Math.round((completedCount / totalVideos) * 100);

    res.status(200).json({
      overallProgress,
      enrolledCompleted: completedCount,
      enrolledTotal: totalVideos,
      streakDays: 0,
      badges: [],
    });
  } catch (error) {
    console.error("Error fetching training progress:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.trackWatchProgress = async (req, res) => {
  try {
    // console.log('Request headers:', req.headers);
    // console.log('Request body:', req.body);
    // console.log('Request params:', req.params);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Request body is missing or empty' });
    }

    const { userId, name, department, completed } = req.body;
    const { id } = req.params;

    // Validate IDs
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: `Invalid FaithProclaim ID: ${id}` });
    }
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: `Invalid userId: ${userId}` });
    }

    // Validate completion status
    if (completed === undefined || typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'Completed field is required and must be a boolean' });
    }

    // Only process if completed: true
    if (!completed) {
      return res.status(200).json({ message: 'Progress not updated: Video not completed' });
    }

    // Update FaithProclaim watchProgress
    const faithProclaim = await FaithProclaim.findById(id);
    if (!faithProclaim) {
      return res.status(404).json({ error: `FaithProclaim not found for ID: ${id}` });
    }

    const existingProgress = faithProclaim.watchProgress.find(
      (wp) => wp.userId.toString() === userId
    );

    if (existingProgress && existingProgress.completed) {
      return res.status(200).json({
        message: 'Progress not updated: User has already completed this video',
        faithProclaim,
      });
    }

    if (existingProgress) {
      existingProgress.completed = true;
      existingProgress.date = new Date();
      if (name) existingProgress.name = name;
      if (department) existingProgress.department = department;
    } else {
      faithProclaim.watchProgress.push({
        userId: new mongoose.Types.ObjectId(userId),
        name: name || 'Unknown',
        department: department || 'Unknown',
        completed: true,
        date: new Date(),
      });
    }

    // Save FaithProclaim progress
    await faithProclaim.save();
    console.log('Updated FaithProclaim watchProgress:', {
      id,
      userId,
      completed: true,
    });

    res.status(200).json({ message: 'Progress tracked successfully', faithProclaim });
  } catch (error) {
    console.error('Error in trackWatchProgress:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};