const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const connection = require('./config');

const app = express();
const PORT = 3000;

// ✅ Session middleware
app.use(session({
  secret: 'superSecret123', // change in production
  resave: false,
  saveUninitialized: false
}));

// ✅ Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Public access to login, JS, CSS, etc.
app.use('/login.html', express.static(path.join(__dirname, 'public', 'login.html')));
app.use('/scripts', express.static(path.join(__dirname, 'public', 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'public', 'styles')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'))); // optional

// ✅ Allow unauthenticated access to specific routes
const openPaths = ['/login.html', '/auth/login', '/auth/logout', '/auth/session'];
app.use((req, res, next) => {
  const user = req.session.user;

  if (
    openPaths.includes(req.path) ||
    req.path.startsWith('/scripts') ||
    req.path.startsWith('/styles') ||
    req.path.startsWith('/assets')
  ) {
    return next();
  }

  // 🔐 Restrict admin.html to Admin role only
  if (req.path === '/admin.html') {
    if (!user) return res.redirect('/login.html');
    if (user.role !== 'Admin') return res.status(403).send('Access Denied');
  }

  // Redirect to login if not authenticated
  if (!user) {
    return res.redirect('/login.html');
  }

  next();
});

// ✅ Serve all other protected static files
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Sample CSV download
app.get('/sample_event_inventory.csv', (req, res) => {
  res.download(path.join(__dirname, 'public', 'sample_event_inventory.csv'));
});

// ✅ API + Auth Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/checklists', require('./routes/checklist'));
app.use('/api/checklists/history', require('./routes/history'));
app.use('/api/event_inventory', require('./routes/eventInventory'));

// ✅ Test route
app.get('/api/test', (req, res) => {
  connection.query('SELECT 1 + 1 AS result', (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'API Working', result: rows[0].result });
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
