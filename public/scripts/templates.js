document.addEventListener('DOMContentLoaded', () => {
    const deviceListBody = document.getElementById('deviceListBody');
    const searchInput = document.getElementById('searchInput');
    const form = document.getElementById('templateForm');
    const saveBtn = form.querySelector('button[type="submit"]');
    let allDevices = [];
  
    // Fetch and display devices
    fetch('/api/devices')
      .then(res => res.json())
      .then(data => {
        allDevices = data;
        renderDeviceList(allDevices);
      });
  
    // Live search
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      const filtered = allDevices.filter(device =>
        device.model_name.toLowerCase().includes(searchTerm) ||
        device.serial_number.toLowerCase().includes(searchTerm) ||
        (device.category && device.category.toLowerCase().includes(searchTerm))
      );
      renderDeviceList(filtered);
    });
  
    function renderDeviceList(devices) {
      deviceListBody.innerHTML = '';
      devices.forEach(device => {
        const row = document.createElement('tr');
        const deviceCheckbox = document.createElement('input');
        deviceCheckbox.type = 'checkbox';
        deviceCheckbox.className = 'device-check';
        deviceCheckbox.value = device.device_id;
  
        // Add toggle for row highlight
        deviceCheckbox.addEventListener('change', () => {
          row.classList.toggle('table-success', deviceCheckbox.checked);
        });
  
        const cell = document.createElement('td');
        cell.appendChild(deviceCheckbox);
  
        row.appendChild(cell);
        row.innerHTML += `
          <td>${device.model_name}</td>
          <td>${device.serial_number}</td>
          <td>${device.category || ''}</td>
          <td>${device.description || ''}</td>
        `;
  
        deviceListBody.appendChild(row);
      });
    }
  
    // Save template
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const templateName = document.getElementById('templateName').value;
      const selected = Array.from(document.querySelectorAll('.device-check:checked'))
                            .map(cb => parseInt(cb.value));
  
      if (!templateName || selected.length === 0) {
        alert('Enter template name and select at least one device.');
        return;
      }
  
      saveBtn.disabled = true;
  
      fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_name: templateName, device_ids: selected })
      })
      .then(res => res.json())
      .then(response => {
        showToast(`✅ Template "${templateName}" saved with ${selected.length} devices.`);
        form.reset();
        document.querySelectorAll('.device-check').forEach(cb => {
          cb.checked = false;
          cb.closest('tr').classList.remove('table-success');
        });
      })
      .finally(() => {
        saveBtn.disabled = false;
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
  