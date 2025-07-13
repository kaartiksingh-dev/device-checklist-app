document.addEventListener('DOMContentLoaded', () => {
  fetch('/auth/session')
    .then(res => res.json())
    .then(data => {
      if (!data.username || data.role !== 'Admin') {
        window.location.href = '/login.html';
      } else {
        document.getElementById('username').textContent = data.username;
        loadUsers();
      }
    });

  document.getElementById('create-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const role = document.getElementById('new-role').value;

    const res = await fetch('/auth/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });

    if (res.ok) {
      alert('User created!');
      loadUsers();
    } else {
      alert('Failed to create user');
    }
  });
});

function loadUsers() {
  fetch('/auth/users')
    .then(res => res.json())
    .then(users => {
      const tbody = document.querySelector('#user-table tbody');
      tbody.innerHTML = '';
      users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${user.username}</td>
          <td>${user.role}</td>
          <td>
            <select onchange="changeRole('${user.username}', this.value)">
              <option value="">Change Role</option>
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
          </td>
          <td><button onclick="resetPassword('${user.username}')">Reset</button></td>
        `;
        tbody.appendChild(tr);
      });
    });
}

function changeRole(username, newRole) {
  fetch('/auth/change-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, role: newRole })
  }).then(res => {
    if (res.ok) loadUsers();
    else alert('Failed to update role');
  });
}

function resetPassword(username) {
  const newPassword = prompt('Enter new password:');
  if (!newPassword) return;

  fetch('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: newPassword })
  }).then(res => {
    if (res.ok) alert('Password reset!');
    else alert('Failed to reset password');
  });
}

function logout() {
  fetch('/auth/logout', { method: 'POST' })
    .then(() => window.location.href = '/login.html');
}
