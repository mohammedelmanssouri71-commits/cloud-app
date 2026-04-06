require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
app.use(cors());

app.use(express.json());

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME     || 'mydb',
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('DB connection failed:', err.message);
    return;
  }
  console.log('Connected to MySQL successfully');
  connection.release();
});

app.get('/api/ping', (req, res) => {
  pool.query('SELECT 1', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ status: 'ok' });
  });
});

app.listen(4000, () => console.log('API running on port 4000'));