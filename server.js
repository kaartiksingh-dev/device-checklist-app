const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./config');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend files from /public
app.use(express.static('public'));

const devicesRoute = require('./routes/devices');
app.use('/api/devices', devicesRoute);

// Test route
app.get('/api/test', (req, res) => {
  connection.query('SELECT 1 + 1 AS result', (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'API Working', result: rows[0].result });
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

const templatesRoute = require('./routes/templates');
app.use('/api/templates', templatesRoute);

const checklistRoute = require('./routes/checklist');
app.use('/api/checklists', checklistRoute);

const historyRoute = require('./routes/history');
app.use('/api/checklists/history', historyRoute);
