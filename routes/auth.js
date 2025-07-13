const express = require('express');
const router = express.Router();
const connection = require('../config');

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  connection.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ✅ Set session properties (this keeps express-session happy)
    const user = results[0];
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    res.json({ success: true, username: user.username, role: user.role });
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // Optional: Clears the session cookie
    res.json({ success: true });
  });
});

// Get session user info
router.get('/session', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json({
    username: req.session.user.username,
    role: req.session.user.role
  });
});

// 🔐 Only allow access if Admin
function isAdmin(req, res, next) {
  if (req.session.user?.role === 'Admin') return next();
  res.status(403).json({ error: 'Forbidden' });
}

// 🔁 Get current session
router.get('/session', (req, res) => {
  res.json(req.session.user || {});
});

// 👥 Get all users
router.get('/users', isAdmin, (req, res) => {
  connection.query('SELECT username, role FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

// ➕ Create new user
router.post('/create', isAdmin, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Missing fields' });

  connection.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, password, role],
    (err) => {
      if (err) return res.status(500).json({ error: 'DB insert failed' });
      res.json({ success: true });
    }
  );
});

// 🔁 Change role
router.post('/change-role', isAdmin, (req, res) => {
  const { username, role } = req.body;
  connection.query(
    'UPDATE users SET role = ? WHERE username = ?',
    [role, username],
    (err) => {
      if (err) return res.status(500).json({ error: 'Update failed' });
      res.json({ success: true });
    }
  );
});

// 🔁 Reset password
router.post('/reset-password', isAdmin, (req, res) => {
  const { username, password } = req.body;
  connection.query(
    'UPDATE users SET password = ? WHERE username = ?',
    [password, username],
    (err) => {
      if (err) return res.status(500).json({ error: 'Password reset failed' });
      res.json({ success: true });
    }
  );
});



module.exports = router;
