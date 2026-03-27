const Event = require("../models/Event");

exports.createEvent = async (req, res) => {
  try {
    const { title, time, mentor, expiresAt } = req.body;

    const event = await Event.create({
      title,
      time,
      mentor,
      expiresAt,
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActiveEvents = async (req, res) => {
  try {
    const now = new Date();

    const events = await Event.find({
      isExpired: false,
      expiresAt: { $gt: now }, // 🔥 auto filter expired
    }).sort({ createdAt: -1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptEvent = async (req, res) => {
  try {
    const { userId } = req.body;
    const { eventId } = req.params;

    const event = await Event.findById(eventId);

    if (!event) return res.status(404).json({ error: "Event not found" });

    // Check expired
    if (event.isExpired || new Date() > event.expiresAt) {
      return res.status(400).json({ error: "Event has expired" });
    }

    // Prevent duplicate accept
    const alreadyAccepted = event.acceptedUsers.some(
      (u) => u.userId.toString() === userId
    );

    if (alreadyAccepted) {
      return res.status(200).json({ message: "Already accepted" });
    }

    event.acceptedUsers.push({ userId });

    await event.save();

    res.json({ message: "Event accepted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.expireEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findByIdAndUpdate(
      eventId,
      { isExpired: true },
      { new: true }
    );

    res.json({ message: "Event expired", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};