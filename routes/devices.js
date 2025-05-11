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
      console.error('❌ Insert Error:', err);
      return res.status(500).json({ error: err });
    }

    // Return updated list
    db.query('SELECT * FROM devices ORDER BY device_id DESC', (err, devices) => {
      if (err) {
        console.error('❌ Fetch Error:', err);
        return res.status(500).json({ error: err });
      }
      res.json(devices);
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

// POST /api/devices/import (bulk import from parsed CSV)
router.post('/import', (req, res) => {
  const { devices } = req.body;

  if (!Array.isArray(devices)) {
    return res.status(400).json({ error: 'Invalid input data.' });
  }

  const failed = [];
  let completed = 0;
  let inserted = 0;

  devices.forEach((device) => {
    if (!device.model_name || device.model_name.trim() === '') {
      failed.push({ ...device, reason: 'Missing model name' });
      completed++;
      return;
    }

    const query = `
      INSERT INTO devices (model_name, serial_number, category, description)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      query,
      [
        device.model_name,
        device.serial_number || '',
        device.category || '',
        device.description || ''
      ],
      (err) => {
        completed++;
        if (err) {
          failed.push({ ...device, reason: err.code || 'DB insert error' });
        } else {
          inserted++;
        }

        if (completed === devices.length) {
          res.json({
            successCount: inserted,
            failed
          });
        }
      }
    );
  });

  // If no devices at all
  if (devices.length === 0) {
    return res.json({ successCount: 0, failed: [] });
  }
});

module.exports = router;
