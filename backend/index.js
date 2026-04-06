require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());

function createConnection() {
  const db = mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'secret',
    database: process.env.DB_NAME     || 'mydb'
  });

  db.connect(err => {
    if (err) {
      console.error('DB connection failed, retrying in 3s...', err.message);
      setTimeout(createConnection, 3000);
      return;
    }
    console.log('Connected to MySQL');
  });

  db.on('error', err => {
    console.error('DB error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
      createConnection();
    }
  });

  return db;
}

let db = createConnection();

app.get('/api/ping', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ status: 'ok' });
  });
});

app.listen(4000, () => console.log('API running on port 4000'));