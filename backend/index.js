require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.PORT) || 4000;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME || 'testdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const mapProduct = (row) => ({
  id: row.id,
  name: row.name,
  price: Number(row.price)
});

function validateProductPayload(payload) {
  const name = payload?.name?.toString().trim();
  const price = Number(payload?.price);

  if (!name || name.length < 2) {
    return { valid: false, message: 'Le champ name est requis (min 2 caractères).' };
  }

  if (!Number.isFinite(price) || price < 0) {
    return { valid: false, message: 'Le champ price doit être un nombre positif ou nul.' };
  }

  return { valid: true, product: { name, price } };
}

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

app.get('/api', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, price FROM products ORDER BY id DESC');
    res.json(rows.map(mapProduct));
  } catch (error) {
    next(error);
  }
});

app.get('/api/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID invalide.' });
    }

    const [rows] = await pool.query('SELECT id, name, price FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    res.json(mapProduct(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.post('/api', async (req, res, next) => {
  try {
    const validation = validateProductPayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    const { name, price } = validation.product;
    const [result] = await pool.query('INSERT INTO products (name, price) VALUES (?, ?)', [name, price]);
    const [rows] = await pool.query('SELECT id, name, price FROM products WHERE id = ?', [result.insertId]);

    res.status(201).json(mapProduct(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.put('/api/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID invalide.' });
    }

    const validation = validateProductPayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    const { name, price } = validation.product;
    const [result] = await pool.query('UPDATE products SET name = ?, price = ? WHERE id = ?', [name, price, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const [rows] = await pool.query('SELECT id, name, price FROM products WHERE id = ?', [id]);
    res.json(mapProduct(rows[0]));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID invalide.' });
    }

    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error('API error:', err.message);
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ error: 'Connexion à la base indisponible.' });
  }

  res.status(500).json({ error: 'Erreur serveur.' });
});

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to MySQL successfully');
  } catch (error) {
    console.error('DB connection failed:', error.message);
  }

  app.listen(port, () => {
    console.log(`API running on port ${port}`);
  });
}

startServer();
