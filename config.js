const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // change if using another username
  password: 'Kaartik@12', // update with your MySQL password
  database: 'device_checklist'
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to MySQL as ID ' + connection.threadId);
});

module.exports = connection;
