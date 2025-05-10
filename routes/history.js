const express = require('express');
const router = express.Router();
const db = require('../config');

// GET all checklists
router.get('/', (req, res) => {
  const query = `
    SELECT 
      checklist_id,
      checklist_name,
      checked_by,
      location,
      DATE_FORMAT(date_created, '%Y-%m-%d') AS date_created
    FROM checklists
    ORDER BY date_created DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// GET single checklist with items
router.get('/:id', (req, res) => {
  const checklistId = req.params.id;

  const itemQuery = `
    SELECT 
      d.model_name, d.serial_number, d.category,
      ci.check_status, ci.issue_description
    FROM checklist_items ci
    JOIN devices d ON ci.device_id = d.device_id
    WHERE ci.checklist_id = ?
  `;

  db.query(itemQuery, [checklistId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

module.exports = router;
