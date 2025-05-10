document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('historyTableBody');
    const searchName = document.getElementById('searchName');
    const searchEngineer = document.getElementById('searchEngineer');
    const searchLocation = document.getElementById('searchLocation');
    const searchDate = document.getElementById('searchDate');
  
    let allChecklists = [];
  
    // Load all checklists
    fetch('/api/checklists/history')
      .then(res => res.json())
      .then(data => {
        allChecklists = data;
        renderTable(data);
      });
  
    // Filter as you type
    [searchName, searchEngineer, searchLocation, searchDate].forEach(input => {
      input.addEventListener('input', () => {
        const filtered = allChecklists.filter(row => {
          return (
            row.checklist_name.toLowerCase().includes(searchName.value.toLowerCase()) &&
            row.checked_by.toLowerCase().includes(searchEngineer.value.toLowerCase()) &&
            row.location.toLowerCase().includes(searchLocation.value.toLowerCase()) &&
            (!searchDate.value || row.date_created === searchDate.value)
          );
        });
        renderTable(filtered);
      });
    });
  
    function renderTable(data) {
      tableBody.innerHTML = '';
      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.checklist_name}</td>
          <td>${row.checked_by}</td>
          <td>${row.location}</td>
          <td>${row.date_created}</td>
          <td><button class="btn btn-sm btn-primary" onclick="viewChecklist(${row.checklist_id}, '${row.checklist_name}')">View</button></td>
        `;
        tableBody.appendChild(tr);
      });
    }
  
    // Load details for selected checklist
    window.viewChecklist = (id, name) => {
      fetch(`/api/checklists/history/${id}`)
        .then(res => res.json())
        .then(items => {
          document.getElementById('checklistModalLabel').textContent = `Checklist: ${name}`;
          const modalBody = document.getElementById('modalChecklistItems');
          modalBody.innerHTML = '';
          items.forEach((item, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${i + 1}</td>
              <td>${item.model_name}</td>
              <td>${item.serial_number}</td>
              <td>${item.category || ''}</td>
              <td>${item.check_status}</td>
              <td>${item.issue_description || ''}</td>
            `;
            modalBody.appendChild(tr);
          });
  
          // Show the modal
          const modal = new bootstrap.Modal(document.getElementById('checklistModal'));
          modal.show();
        });
    };
  
    // Export modal checklist as CSV
    document.getElementById('exportModalCsvBtn').addEventListener('click', () => {
      const rows = [['S.No', 'Model', 'Serial', 'Category', 'Status', 'Issue']];
      const trList = document.querySelectorAll('#modalChecklistItems tr');
  
      trList.forEach((row, i) => {
        const cells = row.querySelectorAll('td');
        rows.push(Array.from(cells).map(td => td.textContent));
      });
  
      const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
  
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Checklist_Details.csv';
      a.click();
    });
  });
  