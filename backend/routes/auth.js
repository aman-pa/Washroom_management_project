const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanRole = role ? role.trim().toLowerCase() : '';

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email: cleanEmail, password: hashedPassword, role: cleanRole });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanRole = role ? role.trim().toLowerCase() : '';

    const user = await User.findOne({ email: cleanEmail });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== cleanRole) return res.status(403).json({ error: 'Invalid role selection for this user' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1h' }
    );

    // Log login activity
    const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Kolkata'});
    await new Activity({ time: timeStr, message: `${user.name} logged in.`, userId: user._id }).save();

    res.status(200).json({ token, user: { name: user.name, role: user.role, email: user.email }});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
