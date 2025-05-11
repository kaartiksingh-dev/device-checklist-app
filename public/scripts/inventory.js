document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('deviceForm');
    const tableBody = document.getElementById('deviceTableBody');
  
    // Load devices on page load
    fetchDevices();
  
    form.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const data = {
        model_name: document.getElementById('model_name').value,
        serial_number: document.getElementById('serial_number').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value
      };
  
      fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(res => res.json())
        .then(result => {
          form.reset();
          fetchDevices();
        });
    });
  
    function fetchDevices() {
      fetch('/api/devices')
        .then(res => res.json())
        .then(devices => {
          tableBody.innerHTML = '';
          devices.forEach(device => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${device.model_name}</td>
              <td>${device.serial_number}</td>
              <td>${device.category || ''}</td>
              <td>${device.description || ''}</td>
              <td><button onclick="deleteDevice(${device.device_id})">Delete</button></td>
            `;
            tableBody.appendChild(row);
          });
        });
    }
  
    window.deleteDevice = (id) => {
      if (!confirm('Delete this device?')) return;
      fetch(`/api/devices/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => fetchDevices());
    };
  });
  
  document.getElementById('exportInventoryBtn').addEventListener('click', () => {
    fetch('/api/devices')
      .then(res => res.json())
      .then(devices => {
        const rows = [['Model Name', 'Serial Number', 'Category', 'Description']];
        devices.forEach(d => {
          rows.push([d.model_name, d.serial_number, d.category || '', d.description || '']);
        });
  
        const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
  
        const a = document.createElement('a');
        a.href = url;
        a.download = 'device_inventory.csv';
        a.click();
      });
  });
  