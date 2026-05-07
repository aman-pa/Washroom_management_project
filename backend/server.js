const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');//ye frontend html files ko backend se communicate krwata h
const bcrypt = require('bcryptjs');

// Routes
const authRoutes = require('./routes/auth');
const washroomRoutes = require('./routes/washrooms');
const complaintRoutes = require('./routes/complaints');
const staffRoutes = require('./routes/staff');
const messageRoutes = require('./routes/messages');

// Models for seed/activity
const User = require('./models/User');
const Washroom = require('./models/Washroom');
const Complaint = require('./models/Complaint');
const Activity = require('./models/Activity');
const { verifyToken } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api', authRoutes); // /api/login, /api/register
app.use('/api/washrooms', washroomRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/messages', messageRoutes);

// Activity Logs endpoint
app.get('/api/activity', verifyToken, async (req, res) => {
  try {
    const activities = await Activity.find().sort({ _id: -1 }).limit(200);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sanitizeq';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    await seedDatabase(); // Run seed function
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startAutoResetScheduler(); // Start the daily auto-reset checker
    });
  })
  .catch(err => console.log('DB Connection Error:', err));

// Seed database if empty
async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('Seeding Database with default users and data...');

    // Hash password for default users
    const salt = await bcrypt.genSalt(10);
    const pwd = await bcrypt.hash('password123', salt);

    await User.insertMany([
      { name: 'Admin User', email: 'admin@hospital.org', password: pwd, role: 'admin' },
      { name: 'Aman Pandey', email: 'amanpandey10a3@gmail.com', password: await bcrypt.hash('952544', salt), role: 'supervisor' },
      { name: 'Janitor Team A', email: 'staffa@gmail.com', password: await bcrypt.hash('123456', salt), role: 'staff' },
      { name: 'Janitor Team B', email: 'staffb@gmail.com', password: await bcrypt.hash('123456', salt), role: 'staff' }
    ]);

    await Washroom.insertMany([
      { idString: 'W-101', location: 'North Wing Floor 1', status: 'Clean', assignedStaff: 'Janitor Team A', lastCleanedTime: '09:00 AM' },
      { idString: 'W-102', location: 'North Wing Floor 1', status: 'Dirty', assignedStaff: 'Unassigned', lastCleanedTime: '07:30 AM' },
      { idString: 'W-201', location: 'East Wing Floor 2', status: 'Clean', assignedStaff: 'Janitor Team B', lastCleanedTime: '10:15 AM' },
      { idString: 'W-301', location: 'South Wing Floor 3', status: 'Dirty', assignedStaff: 'Unassigned', lastCleanedTime: '08:45 AM' }
    ]);

    await Complaint.insertMany([
      { idString: '#10042', washroomId: 'W-102', issueType: 'Needs General Cleaning', reportedBy: 'Visitor', time: '10:42 AM', status: 'Pending Response', createdAt: '10:42 AM' },
      { idString: '#10041', washroomId: 'W-301', issueType: 'Out of Soap', reportedBy: 'Dr. Alan Grant', time: '09:15 AM', status: 'Assigned to Janitor Team A', createdAt: '09:15 AM' }
    ]);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    await new Activity({ time: timeStr, message: 'System initialized and seeded.' }).save();
    console.log('Database seeded!');
  }
}

// ============================================
// Automatic Daily Reset Scheduler
// Resets all washrooms to Dirty at midnight (every 24 hours)
// ============================================
const fs = require('fs');
const LAST_RESET_FILE = path.join(__dirname, '.last_reset_date');

function getLastResetDate() {
  try {
    if (fs.existsSync(LAST_RESET_FILE)) {
      return fs.readFileSync(LAST_RESET_FILE, 'utf-8').trim();
    }
  } catch (e) {
    console.warn('Could not read last reset date:', e.message);
  }
  return null;
}

function saveLastResetDate(dateStr) {
  try {
    fs.writeFileSync(LAST_RESET_FILE, dateStr, 'utf-8');
  } catch (e) {
    console.warn('Could not save last reset date:', e.message);
  }
}

async function autoResetIfNewDay() {
  const today = new Date().toISOString().split('T')[0]; // e.g. "2026-04-19"
  const lastReset = getLastResetDate();

  if (lastReset !== today) {
    try {
      await Washroom.updateMany({}, { status: 'Dirty', lastCleanedTime: 'Never' });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
      await new Activity({ time: timeStr, message: 'System auto-reset: All washrooms reset to Dirty for the new day.' }).save();

      saveLastResetDate(today);
      console.log(`Auto-reset completed for new day: ${today}`);
    } catch (err) {
      console.error('Auto-reset failed:', err.message);
    }
  }
}

// Check every hour if a new day has started
function startAutoResetScheduler() {
  // Run immediately on startup
  autoResetIfNewDay();
  // Then check every hour (3600000ms)
  setInterval(autoResetIfNewDay, 60 * 60 * 1000);
  console.log('Auto-reset scheduler started (checks every hour for new day).');
}

