document.addEventListener('DOMContentLoaded', () => {
    const csvFileInput = document.getElementById('csvFile');
    const previewBtn = document.getElementById('previewBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const previewTableBody = document.getElementById('previewTableBody');
    const previewContainer = document.getElementById('previewContainer');
    const resultSummary = document.getElementById('resultSummary');
  
    let parsedData = [];
  
    // Helper to parse CSV text
    function parseCSV(text) {
      const rows = text.trim().split('\n').map(r => r.split(','));
      const headers = rows[0].map(h => h.trim().toLowerCase());
      const data = [];
  
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 1 || row.every(cell => cell.trim() === '')) continue;
  
        const device = {
          model_name: row[headers.indexOf('model_name')]?.trim() || null,
          serial_number: row[headers.indexOf('serial_number')]?.trim() || '',
          category: row[headers.indexOf('category')]?.trim() || '',
          description: row[headers.indexOf('description')]?.trim() || ''
        };
  
        data.push(device);
      }
      return data;
    }
  
    // Preview button click
    previewBtn.addEventListener('click', () => {
      const file = csvFileInput.files[0];
      if (!file) return alert('Please select a CSV file.');
  
      const reader = new FileReader();
      reader.onload = () => {
        parsedData = parseCSV(reader.result);
        if (parsedData.length === 0) {
          alert('No valid rows found in the file.');
          return;
        }
  
        // Show preview
        previewTableBody.innerHTML = '';
        parsedData.forEach(device => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${device.model_name || '<span class="text-danger">Missing</span>'}</td>
            <td>${device.serial_number}</td>
            <td>${device.category}</td>
            <td>${device.description}</td>
          `;
          previewTableBody.appendChild(row);
        });
  
        previewContainer.style.display = 'block';
        uploadBtn.disabled = false;
      };
      reader.readAsText(file);
    });
  
    // Upload button click
    uploadBtn.addEventListener('click', () => {
      fetch('/api/devices/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: parsedData })
      })
        .then(res => res.json())
        .then(response => {
          const { successCount, failed } = response;
          resultSummary.style.display = 'block';
          resultSummary.className = 'alert alert-info';
          resultSummary.innerHTML = `
            ✅ <strong>${successCount}</strong> device(s) imported successfully.<br>
            ❌ <strong>${failed.length}</strong> failed.
            ${failed.length ? '<br><ul>' + failed.map(f => `<li>${f.model_name || '[Missing name]'} - ${f.reason}</li>`).join('') + '</ul>' : ''}
          `;
          uploadBtn.disabled = true;
        })
        .catch(err => {
          console.error(err);
          alert('Something went wrong during import.');
        });
    });
  });
  