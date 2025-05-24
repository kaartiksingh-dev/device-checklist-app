const express = require('express');
const router = express.Router();
const db = require('../config');

// GET all items
router.get('/', (req, res) => {
  db.query('SELECT * FROM event_inventory ORDER BY s_no ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// POST: Add new item
router.post('/', (req, res) => {
  const {
    material, make, model, serial_number,
    asset_tag_number, quantity, location, remark_1, remark_2
  } = req.body;

  if (!material) return res.status(400).json({ error: 'Material is required.' });

  const query = `
    INSERT INTO event_inventory (material, make, model, serial_number, asset_tag_number, quantity, location, remark_1, remark_2)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [material, make, model, serial_number, asset_tag_number, quantity || 1, location, remark_1, remark_2], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Item added successfully', id: result.insertId });
  });
});

// ✅ DELETE ALL — needs to appear before `/:id`
router.delete('/delete-all', (req, res) => {
  db.query('DELETE FROM event_inventory', (err) => {
    if (err) {
      console.error('❌ DELETE error:', err);
      return res.status(500).json({ error: err });
    }

    // Optional: Reset numbering (not required unless you want)
    db.query('ALTER TABLE event_inventory AUTO_INCREMENT = 1', (err2) => {
      if (err2) return res.status(500).json({ error: err2 });
      res.json({ message: 'All items deleted and auto-increment reset' });
    });
  });
});

// ✅ BULK DELETE route (selected checkboxes)
router.post('/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid IDs' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const deleteQuery = `DELETE FROM event_inventory WHERE s_no IN (${placeholders})`;

  db.query(deleteQuery, ids, (err) => {
    if (err) return res.status(500).json({ error: err });

    const reorderQuery = `
      SET @row_number = 0;
      UPDATE event_inventory 
      JOIN (SELECT s_no FROM event_inventory ORDER BY s_no) AS ordered
      ON event_inventory.s_no = ordered.s_no
      SET event_inventory.s_no = (@row_number := @row_number + 1)
    `;

    db.query(reorderQuery, (reorderErr) => {
      if (reorderErr) return res.status(500).json({ error: reorderErr });
      res.json({ message: 'Selected items deleted and S.No reordered' });
    });
  });
});

// PUT: Update item
router.put('/:id', (req, res) => {
  const {
    material, make, model, serial_number,
    asset_tag_number, quantity, location, remark_1, remark_2
  } = req.body;

  const { id } = req.params;

  const query = `
    UPDATE event_inventory
    SET material = ?, make = ?, model = ?, serial_number = ?, asset_tag_number = ?, quantity = ?, location = ?, remark_1 = ?, remark_2 = ?
    WHERE s_no = ?
  `;

  db.query(query, [material, make, model, serial_number, asset_tag_number, quantity, location, remark_1, remark_2, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Item updated successfully' });
  });
});

// DELETE one item
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM event_inventory WHERE s_no = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });

    const reorderQuery = `
      SET @row_number = 0;
      UPDATE event_inventory 
      JOIN (SELECT s_no FROM event_inventory ORDER BY s_no) AS ordered
      ON event_inventory.s_no = ordered.s_no
      SET event_inventory.s_no = (@row_number := @row_number + 1)
    `;

    db.query(reorderQuery, (reorderErr) => {
      if (reorderErr) return res.status(500).json({ error: reorderErr });
      res.json({ message: 'Item deleted and S.No reordered' });
    });
  });
});

// POST /import: Import from CSV
router.post('/import', (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid data format.' });
  }

  let successCount = 0;
  const failed = [];

  items.forEach((item) => {
    if (!item.material || item.material.trim() === '') {
      failed.push({ ...item, reason: 'Missing material' });
      return;
    }

    const query = `
      INSERT INTO event_inventory (material, make, model, serial_number, asset_tag_number, quantity, location, remark_1, remark_2)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
      item.material,
      item.make || '',
      item.model || '',
      item.serial_number || '',
      item.asset_tag_number || '',
      item.quantity || 1,
      item.location || '',
      item.remark_1 || '',
      item.remark_2 || ''
    ], (err) => {
      if (err) {
        failed.push({ ...item, reason: err.code || 'DB error' });
      } else {
        successCount++;
      }

      if (successCount + failed.length === items.length) {
        const reorderQuery = `
          SET @row_number = 0;
          UPDATE event_inventory 
          JOIN (SELECT s_no FROM event_inventory ORDER BY s_no) AS ordered
          ON event_inventory.s_no = ordered.s_no
          SET event_inventory.s_no = (@row_number := @row_number + 1)
        `;
        db.query(reorderQuery, () => {
          res.json({ successCount, failed });
        });
      }
    });
  });

  if (items.length === 0) {
    res.json({ successCount: 0, failed: [] });
  }
});

// GET single item
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM event_inventory WHERE s_no = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(results[0]);
  });
});

module.exports = router;
