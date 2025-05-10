const express = require('express');
const router = express.Router();
const db = require('../config');

// POST /api/templates - Save a new template with selected devices
router.post('/', (req, res) => {
  const { template_name, device_ids } = req.body;

  if (!template_name || !Array.isArray(device_ids) || device_ids.length === 0) {
    return res.status(400).json({ error: 'Template name and at least one device are required.' });
  }

  // Insert template first
  const insertTemplateQuery = 'INSERT INTO templates (template_name, created_by) VALUES (?, ?)';
  db.query(insertTemplateQuery, [template_name, 'Engineer'], (err, result) => {
    if (err) return res.status(500).json({ error: err });

    const templateId = result.insertId;

    // Insert devices into template_devices table
    const insertDevicesQuery = 'INSERT INTO template_devices (template_id, device_id) VALUES ?';
    const values = device_ids.map(deviceId => [templateId, deviceId]);

    db.query(insertDevicesQuery, [values], (err2) => {
      if (err2) return res.status(500).json({ error: err2 });

      res.json({ message: 'Template saved successfully', template_id: templateId });
    });
  });
});

// GET /api/templates - Fetch all templates with device count
router.get('/', (req, res) => {
  const query = `
    SELECT t.template_id, t.template_name, COUNT(td.device_id) AS device_count, t.created_at
    FROM templates t
    LEFT JOIN template_devices td ON t.template_id = td.template_id
    GROUP BY t.template_id
    ORDER BY t.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// GET /api/templates/:id - Fetch device details for a specific template
router.get('/:id', (req, res) => {
  const templateId = req.params.id;
  const query = `
    SELECT d.device_id, d.model_name, d.serial_number, d.category, d.description
    FROM template_devices td
    JOIN devices d ON td.device_id = d.device_id
    WHERE td.template_id = ?
  `;
  db.query(query, [templateId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

module.exports = router;
