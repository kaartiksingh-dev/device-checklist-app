// public/scripts/session.js

// Utility to fetch logged-in user info
async function getSessionInfo() {
  try {
    const res = await fetch('/auth/session');
    if (!res.ok) throw new Error('Session expired');

    const data = await res.json();
    document.getElementById('session-info').textContent = `Logged in as: ${data.username} (${data.role})`;
  } catch (err) {
    console.warn('Redirecting to login...');
    window.location.href = '/login.html';
  }
}

// Logout function
async function logout() {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}
