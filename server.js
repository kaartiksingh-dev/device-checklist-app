const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const connection = require('./config');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend files from /public
app.use(express.static('public'));

// Serve sample event inventory CSV
app.get('/sample_event_inventory.csv', (req, res) => {
  res.download(path.join(__dirname, 'public', 'sample_event_inventory.csv'));
});

// Routes
const devicesRoute = require('./routes/devices');
app.use('/api/devices', devicesRoute);

const templatesRoute = require('./routes/templates');
app.use('/api/templates', templatesRoute);

const checklistRoute = require('./routes/checklist');
app.use('/api/checklists', checklistRoute);

const historyRoute = require('./routes/history');
app.use('/api/checklists/history', historyRoute);

const eventInventoryRoute = require('./routes/eventInventory');
app.use('/api/event_inventory', eventInventoryRoute);

// Test route
app.get('/api/test', (req, res) => {
  connection.query('SELECT 1 + 1 AS result', (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'API Working', result: rows[0].result });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
