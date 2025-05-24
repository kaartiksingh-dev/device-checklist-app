document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('inventoryTableBody');
  const searchInput = document.getElementById('searchInput');
  const exportAllBtn = document.getElementById('exportAllBtn');
  const addNewBtn = document.getElementById('addNewBtn');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  const csvFile = document.getElementById('csvFile');
  const previewBtn = document.getElementById('previewBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const previewTableBody = document.getElementById('previewTableBody');
  const previewContainer = document.getElementById('previewContainer');
  const resultSummary = document.getElementById('resultSummary');
  const inventoryForm = document.getElementById('inventoryForm');
  const modal = new bootstrap.Modal(document.getElementById('inventoryModal'));
  const inventoryId = document.getElementById('inventoryId');
  const selectAllCheckbox = document.getElementById('selectAll');
  const deleteAllBottomBtn = document.getElementById('deleteAllBottomBtn');
  const toastContainer = document.getElementById('toastContainer');

  let parsedItems = [];
  let editingId = null;

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function loadInventory() {
    fetch('/api/event_inventory')
      .then(res => res.json())
      .then(renderTable);
  }

  function renderTable(data) {
    tableBody.innerHTML = '';
    data.forEach((item, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="checkbox" class="selectItem" data-id="${item.s_no}"></td>
        <td>${index + 1}</td>
        <td>${item.material}</td>
        <td>${item.make || ''}</td>
        <td>${item.model || ''}</td>
        <td>${item.serial_number || ''}</td>
        <td>${item.asset_tag_number || ''}</td>
        <td>${item.quantity}</td>
        <td>${item.location || ''}</td>
        <td>${item.remark_1 || ''}</td>
        <td>${item.remark_2 || ''}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1 editBtn" data-id="${item.s_no}">Edit</button>
          <button class="btn btn-sm btn-danger deleteBtn" data-id="${item.s_no}">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    attachRowEvents();
  }

  function attachRowEvents() {
    document.querySelectorAll('.editBtn').forEach(btn =>
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        fetch(`/api/event_inventory/${id}`)
          .then(res => res.json())
          .then(item => {
            editingId = id;
            inventoryForm.reset();
            inventoryId.value = id;
            document.getElementById('material').value = item.material;
            document.getElementById('make').value = item.make || '';
            document.getElementById('model').value = item.model || '';
            document.getElementById('serial_number').value = item.serial_number || '';
            document.getElementById('asset_tag_number').value = item.asset_tag_number || '';
            document.getElementById('quantity').value = item.quantity || 1;
            document.getElementById('location').value = item.location || '';
            document.getElementById('remark_1').value = item.remark_1 || '';
            document.getElementById('remark_2').value = item.remark_2 || '';
            modal.show();
          });
      })
    );

    document.querySelectorAll('.deleteBtn').forEach(btn =>
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        if (!confirm('Delete this item?')) return;
        fetch(`/api/event_inventory/${id}`, { method: 'DELETE' })
          .then(() => {
            showToast('Item deleted', 'danger');
            loadInventory();
          });
      })
    );
  }

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', () => {
      const visibleRows = tableBody.querySelectorAll('tr');
      visibleRows.forEach(row => {
        if (row.style.display !== 'none') {
          const checkbox = row.querySelector('.selectItem');
          if (checkbox) checkbox.checked = selectAllCheckbox.checked;
        }
      });
    });
  }

  deleteSelectedBtn.addEventListener('click', () => {
    const selected = document.querySelectorAll('.selectItem:checked');
    if (selected.length === 0) return alert('Please select at least one entry.');
    if (!confirm(`Delete ${selected.length} selected item(s)?`)) return;

    const ids = Array.from(selected).map(cb => cb.getAttribute('data-id'));
    fetch('/api/event_inventory/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    }).then(() => {
      showToast('Selected items deleted', 'danger');
      loadInventory();
    });
  });

  function handleDeleteAll() {
    if (!confirm('Are you sure you want to delete all inventory entries? This action cannot be undone.')) return;
    fetch('/api/event_inventory/delete-all', {
      method: 'DELETE'
    }).then(() => {
      showToast('All items deleted', 'danger');
      loadInventory();
    });
  }

  deleteAllBtn?.addEventListener('click', handleDeleteAll);
  deleteAllBottomBtn?.addEventListener('click', handleDeleteAll);

  addNewBtn.addEventListener('click', () => {
    editingId = null;
    inventoryForm.reset();
    inventoryId.value = '';
    modal.show();
  });

  inventoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const item = {
      material: document.getElementById('material').value.trim(),
      make: document.getElementById('make').value.trim(),
      model: document.getElementById('model').value.trim(),
      serial_number: document.getElementById('serial_number').value.trim(),
      asset_tag_number: document.getElementById('asset_tag_number').value.trim(),
      quantity: parseInt(document.getElementById('quantity').value) || 1,
      location: document.getElementById('location').value.trim(),
      remark_1: document.getElementById('remark_1').value.trim(),
      remark_2: document.getElementById('remark_2').value.trim()
    };

    const url = editingId ? `/api/event_inventory/${editingId}` : '/api/event_inventory';
    const method = editingId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).then(() => {
      showToast(editingId ? 'Item updated' : 'New item added', 'success');
      modal.hide();
      loadInventory();
    });
  });

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase();
    const rows = tableBody.querySelectorAll('tr');
    let visibleIndex = 1;
    rows.forEach(row => {
      const match = Array.from(row.children).some(td => td.textContent.toLowerCase().includes(term));
      row.style.display = match ? '' : 'none';
      if (match) row.children[1].textContent = visibleIndex++;
    });
  });

  exportAllBtn.addEventListener('click', () => {
    const rows = [['S.No', 'Material', 'Make', 'Model', 'Serial Number', 'Asset TAG', 'Quantity', 'Location', 'Remark 1', 'Remark 2']];
    const trList = tableBody.querySelectorAll('tr');
    let visibleIndex = 1;
    trList.forEach(row => {
      if (row.style.display === 'none') return;
      const cells = row.querySelectorAll('td');
      if (cells.length >= 12) {
        rows.push([
          visibleIndex++,
          ...Array.from(cells).slice(2, 11).map(td => `"${td.textContent}"`)
        ]);
      }
    });

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Event_Inventory.csv';
    a.click();
  });

  previewBtn.addEventListener('click', () => {
    const file = csvFile.files[0];
    if (!file) return alert('Please select a CSV file.');

    const reader = new FileReader();
    reader.onload = () => {
      const lines = reader.result.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      parsedItems = [];

      previewTableBody.innerHTML = '';
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        const item = {
          material: row[headers.indexOf('material')]?.trim() || '',
          make: row[headers.indexOf('make')]?.trim() || '',
          model: row[headers.indexOf('model')]?.trim() || '',
          serial_number: row[headers.indexOf('serial_number')]?.trim() || '',
          asset_tag_number: row[headers.indexOf('asset_tag_number')]?.trim() || '',
          quantity: parseInt(row[headers.indexOf('quantity')]) || 1,
          location: row[headers.indexOf('location')]?.trim() || '',
          remark_1: row[headers.indexOf('remark_1')]?.trim() || '',
          remark_2: row[headers.indexOf('remark_2')]?.trim() || ''
        };

        if (!item.material) continue;
        parsedItems.push(item);

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.material}</td>
          <td>${item.make}</td>
          <td>${item.model}</td>
          <td>${item.serial_number}</td>
          <td>${item.asset_tag_number}</td>
          <td>${item.quantity}</td>
          <td>${item.location}</td>
          <td>${item.remark_1}</td>
          <td>${item.remark_2}</td>
        `;
        previewTableBody.appendChild(tr);
      }

      previewContainer.style.display = 'block';
      uploadBtn.disabled = parsedItems.length === 0;
    };
    reader.readAsText(file);
  });

  uploadBtn.addEventListener('click', () => {
    fetch('/api/event_inventory/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: parsedItems })
    })
      .then(res => res.json())
      .then(({ successCount, failed }) => {
        resultSummary.innerHTML = `
          ✅ <strong>${successCount}</strong> item(s) imported.<br>
          ❌ <strong>${failed.length}</strong> failed.
          ${failed.length ? '<ul>' + failed.map(f => `<li>${f.material || 'Unnamed'} - ${f.reason}</li>`).join('') + '</ul>' : ''}
        `;
        resultSummary.className = 'alert alert-info mt-2';
        resultSummary.style.display = 'block';
        uploadBtn.disabled = true;
        showToast('Import completed', failed.length ? 'warning' : 'success');
        loadInventory();
      });
  });

  loadInventory();
});
