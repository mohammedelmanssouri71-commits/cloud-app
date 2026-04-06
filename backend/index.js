const express = require('express');
const mysql = require('mysql2');
const app = express();
require('dotenv').config();

app.use(express.json());

const db = mysql.createConnection({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME     || 'mydb'
});

db.connect(err => {
  if (err) console.error('DB connection failed:', err.message);
  else console.log('Connected to MySQL');
});

app.get('/api/ping', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ status: 'ok' });
  });
});

app.listen(4000, () => console.log('API running on port 4000'));