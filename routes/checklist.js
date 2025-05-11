const express = require('express');
const router = express.Router();
const db = require('../config');

// POST /api/checklists
router.post('/', (req, res) => {
  const {
    checklist_name,
    checked_by,
    location,
    start_time,
    end_time,
    notes,
    template_id,
    items
  } = req.body;

  if (!checklist_name || !checked_by || !location || !template_id || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const insertChecklistQuery = `
    INSERT INTO checklists (checklist_name, checked_by, location, start_time, end_time, notes, template_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertChecklistQuery,
    [checklist_name, checked_by, location, start_time, end_time, notes, template_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });

      const checklistId = result.insertId;

      // Insert checklist items
      const insertItemsQuery = `
        INSERT INTO checklist_items (checklist_id, device_id, check_status, issue_description)
        VALUES ?
      `;

      // Match devices from the template
      const values = items.map(item => [
        checklistId,
        item.device_id,
        item.check_status,
        item.issue_description || null
      ]);
      
      db.query(insertItemsQuery, [values], (err3) => {
        if (err3) return res.status(500).json({ error: err3 });
      
        res.json({ message: 'Checklist saved successfully', checklist_id: checklistId });
      });
    }
  );
});

module.exports = router;
