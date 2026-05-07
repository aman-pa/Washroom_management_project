const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Activity = require('../models/Activity');
const { verifyToken, checkRole } = require('../middleware/auth');

// Public endpoint to send a message
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, content } = req.body;
    const timeStr = new Date().toLocaleString([], {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata'
    });

    const newMessage = new Message({
      name: name || 'Anonymous',
      email,
      subject,
      content,
      createdAt: timeStr
    });

    await newMessage.save();

    // Log the activity internally
    const logTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    await new Activity({ time: logTimeStr, message: `New contact message received from ${email}` }).save();

    res.status(201).json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin endpoint to read messages
router.get('/', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const messages = await Message.find().sort({ _id: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
