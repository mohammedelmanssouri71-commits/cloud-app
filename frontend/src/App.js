import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const initialForm = { name: '', price: '' };

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const endpoint = useMemo(() => `${API_URL}/api`, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Impossible de charger les données.');
      }

      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const payload = {
      name: form.name.trim(),
      price: Number(form.price)
    };

    const isEditing = editingId !== null;
    const url = isEditing ? `${endpoint}/${editingId}` : endpoint;

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = response.status === 204 ? null : await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Action impossible.');
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (product) => {
    setEditingId(product.id);
    setForm({ name: product.name, price: product.price.toString() });
  };

  const handleDelete = async (id) => {
    setError('');

    try {
      const response = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Suppression impossible.');
      }

      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="app">
      <h1>Catalogue de produits</h1>

      <form className="card" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Modifier un produit' : 'Ajouter un produit'}</h2>

        <label>
          Nom
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            minLength={2}
            required
            placeholder="Ex: Clavier mécanique"
          />
        </label>

        <label>
          Prix (€)
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            required
            placeholder="Ex: 79.99"
          />
        </label>

        <div className="actions">
          <button type="submit">{editingId ? 'Enregistrer' : 'Ajouter'}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>
              Annuler
            </button>
          )}
        </div>
      </form>

      {error && <p className="error">Erreur: {error}</p>}
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <section className="card">
          <h2>Produits</h2>
          {products.length === 0 ? (
            <p>Aucun produit pour le moment.</p>
          ) : (
            <ul className="list">
              {products.map((product) => (
                <li key={product.id}>
                  <span>
                    <strong>{product.name}</strong> - {Number(product.price).toFixed(2)} €
                  </span>
                  <div className="actions">
                    <button type="button" onClick={() => startEditing(product)}>
                      Modifier
                    </button>
                    <button type="button" className="danger" onClick={() => handleDelete(product.id)}>
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
