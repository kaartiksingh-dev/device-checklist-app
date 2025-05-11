document.addEventListener('DOMContentLoaded', () => {
  const templateSelect = document.getElementById('templateSelect');
  const checklistContainer = document.getElementById('checklistContainer');
  const checklistTableBody = document.getElementById('checklistTableBody');
  const checklistDate = document.getElementById('checklistDate');
  const finishBtn = document.getElementById('finishChecklistBtn');

  const today = new Date().toISOString().split('T')[0];
  checklistDate.value = today;

  // Fetch templates
  fetch('/api/templates')
    .then(res => res.json())
    .then(data => {
      data.forEach(template => {
        const option = document.createElement('option');
        option.value = template.template_id;
        option.textContent = `${template.template_name} (${template.device_count} devices)`;
        templateSelect.appendChild(option);
      });
    });

  // Load devices from selected template
  templateSelect.addEventListener('change', () => {
    const templateId = templateSelect.value;
    if (!templateId) return checklistContainer.style.display = 'none';

    fetch(`/api/templates/${templateId}`)
      .then(res => res.json())
      .then(devices => {
        checklistTableBody.innerHTML = '';
        devices.forEach((device, index) => {
          const row = document.createElement('tr');
          row.dataset.deviceId = device.device_id; // attach device_id
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${device.model_name}</td>
            <td>${device.serial_number}</td>
            <td>${device.category || ''}</td>
            <td>
              <select class="form-select status-select">
                <option value="OK">OK</option>
                <option value="Not Working">Not Working</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </td>
            <td>
              <input type="text" class="form-control issue-field" placeholder="Describe issue..." disabled>
            </td>
          `;
          checklistTableBody.appendChild(row);
        });

        checklistContainer.style.display = 'block';
        finishBtn.disabled = false;

        // Enable/disable issue input
        document.querySelectorAll('.status-select').forEach((select, idx) => {
          select.addEventListener('change', () => {
            const issueInput = document.querySelectorAll('.issue-field')[idx];
            issueInput.disabled = select.value !== 'Not Working';
            if (select.value !== 'Not Working') issueInput.value = '';
          });
        });
      });
  });

  // Finish checklist
  finishBtn.addEventListener('click', () => {
    if (!confirm('Are you sure you want to complete this checklist? This action cannot be undone.')) return;

    const checklistInfo = {
      checklist_name: document.getElementById('checklistName').value,
      checked_by: document.getElementById('checkedBy').value,
      location: document.getElementById('location').value,
      start_time: document.getElementById('startTime').value,
      end_time: document.getElementById('endTime').value,
      notes: document.getElementById('notes').value,
      template_id: parseInt(templateSelect.value),
      items: []
    };

    const rows = checklistTableBody.querySelectorAll('tr');
    rows.forEach((row) => {
      const device_id = parseInt(row.dataset.deviceId);
      const check_status = row.querySelector('.status-select').value;
      const issue_description = row.querySelector('.issue-field').value;
      checklistInfo.items.push({ device_id, check_status, issue_description });
    });

    fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checklistInfo)
    })
      .then(res => res.json())
      .then(data => {
        showToast('✅ Checklist completed successfully.');
        setTimeout(() => {
          window.location.href = '/history.html';
        }, 1500);
      })
      .catch(err => {
        showToast('❌ Error saving checklist.');
        console.error(err);
      });
  });

  function showToast(message) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 show shadow';
    toast.role = 'alert';
    toast.style = 'min-width: 250px;';
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
});

// Export CSV
document.getElementById('exportCsvBtn').addEventListener('click', () => {
  const checklistTableBody = document.getElementById('checklistTableBody');
  const rows = [['S.No', 'Model', 'Serial', 'Category', 'Status', 'Issue']];
  const trList = checklistTableBody.querySelectorAll('tr');

  trList.forEach((row, i) => {
    const model = row.cells[1].innerText;
    const serial = row.cells[2].innerText;
    const category = row.cells[3].innerText;
    const status = row.querySelector('.status-select').value;
    const issue = row.querySelector('.issue-field').value;
    rows.push([i + 1, model, serial, category, status, issue]);
  });

  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'Checklist.csv';
  a.click();
});
