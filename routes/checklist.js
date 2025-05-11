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

  // Debug incoming request data
  console.log('🔁 Incoming checklist data:', {
    checklist_name,
    checked_by,
    location,
    start_time,
    end_time,
    notes,
    template_id,
    items
  });

  // Basic validation
  if (!checklist_name || !checked_by || !location || !template_id || !Array.isArray(items)) {
    console.error('❌ Missing required fields');
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
      if (err) {
        console.error('❌ Failed to insert checklist:', err);
        return res.status(500).json({ error: err });
      }

      const checklistId = result.insertId;
      console.log('✅ Checklist inserted with ID:', checklistId);

      const insertItemsQuery = `
        INSERT INTO checklist_items (checklist_id, device_id, check_status, issue_description)
        VALUES ?
      `;

      const values = items.map(item => [
        checklistId,
        item.device_id,
        item.check_status,
        item.issue_description || null
      ]);

      db.query(insertItemsQuery, [values], (err3) => {
        if (err3) {
          console.error('❌ Failed to insert checklist items:', err3);
          return res.status(500).json({ error: err3 });
        }

        console.log('✅ Checklist items inserted');
        res.json({ message: 'Checklist saved successfully', checklist_id: checklistId });
      });
    }
  );
});

module.exports = router;

// GET /api/checklists/history/:id → fetch checklist items + device info
router.get('/history/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT d.model_name, d.serial_number, d.category,
           ci.check_status, ci.issue_description
    FROM checklist_items ci
    JOIN devices d ON ci.device_id = d.device_id
    WHERE ci.checklist_id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('❌ Error fetching checklist details:', err);
      return res.status(500).json({ error: 'Failed to load checklist items' });
    }

    res.json(results);
  });
});
