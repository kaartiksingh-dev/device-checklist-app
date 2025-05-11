const express = require('express');
const router = express.Router();
const db = require('../config');

// GET all devices
router.get('/', (req, res) => {
  db.query('SELECT * FROM devices ORDER BY device_id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// POST add new device
router.post('/', (req, res) => {
  const { model_name, serial_number, category, description } = req.body;

  if (!model_name || !serial_number) {
    return res.status(400).json({ error: 'Model name and serial number are required.' });
  }

  const query = 'INSERT INTO devices (model_name, serial_number, category, description) VALUES (?, ?, ?, ?)';
  db.query(query, [model_name, serial_number, category, description], (err, result) => {
    if (err) {
      console.error('❌ Insert Error:', err); // 👈 added for Render log visibility
      return res.status(500).json({ error: err });
    }

    // Optional: fetch updated list
    db.query('SELECT * FROM devices ORDER BY device_id DESC', (err, devices) => {
      if (err) {
        console.error('❌ Fetch Error:', err); // 👈 also added just in case
        return res.status(500).json({ error: err });
      }
      res.json(devices); // This matches what inventory.js expects
    });
  });
});

// PUT update a device
router.put('/:id', (req, res) => {
  const { model_name, serial_number, category, description } = req.body;
  const { id } = req.params;

  const query = 'UPDATE devices SET model_name = ?, serial_number = ?, category = ?, description = ? WHERE device_id = ?';
  db.query(query, [model_name, serial_number, category, description, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Device updated successfully' });
  });
});

// DELETE a device
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM devices WHERE device_id = ?';
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Device deleted successfully' });
  });
});

module.exports = router;
