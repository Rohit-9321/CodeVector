import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "";

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cursorStack, setCursorStack] = useState([]);
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setError("Failed to load categories"));
  }, []);

  const fetchProducts = useCallback(
    async (cursor) => {
      setLoading(true);
      setError(null);
      setSimResult(null);
      try {
        const params = new URLSearchParams({ limit: 20 });
        if (selectedCategory) params.set("category", selectedCategory);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`${API}/api/products?${params}`);
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();

        setProducts(data.products);
        setNextCursor(data.nextCursor);
      } catch {
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory]
  );

  useEffect(() => {
    setCursorStack([]);
    setCurrentCursor(null);
    setNextCursor(null);
    fetchProducts(null);
  }, [selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  function goNext() {
    setCursorStack((prev) => [...prev, currentCursor]);
    setCurrentCursor(nextCursor);
    fetchProducts(nextCursor);
  }

  function goPrev() {
    const stack = [...cursorStack];
    const prevCursor = stack.pop();
    setCursorStack(stack);
    setCurrentCursor(prevCursor);
    fetchProducts(prevCursor);
  }

  // Simulate 50 inserts + 50 updates, then re-fetch THE SAME PAGE
  // using the exact same cursor — proving no duplicates or missing items
  async function handleSimulate() {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch(`${API}/api/simulate-changes`, { method: "POST" });
      const data = await res.json();
      setSimResult(data.message + " — re-fetching same page with same cursor...");

      // Re-fetch the current page with the SAME cursor to prove stability
      await fetchProducts(currentCursor);
      setSimResult(
        "✅ Done! 50 products added + 50 updated. Page re-fetched with same cursor — check that products are identical (no duplicates, no skips)."
      );
    } catch {
      setSimResult("Simulation failed");
    } finally {
      setSimulating(false);
    }
  }

  const isFirstPage = cursorStack.length === 0;
  const pageNumber = cursorStack.length + 1;

  return (
    <div className="app">
      <header className="header">
        <h1>Product Browser</h1>
        <p className="subtitle">200,000 products — fast cursor-based pagination</p>
      </header>

      <div className="toolbar">
        <div className="controls">
          <label htmlFor="category-select">Filter by category:</label>
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          className="sim-btn"
          onClick={handleSimulate}
          disabled={simulating || loading}
          title="Inserts 50 new products + updates 50 existing ones, then re-fetches this page to prove pagination stays stable"
        >
          {simulating ? "Simulating..." : "⚡ Simulate 50 Inserts + 50 Updates"}
        </button>
      </div>

      {simResult && <div className="sim-result">{simResult}</div>}
      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty">No products found.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td><span className="badge">{p.category}</span></td>
                  <td className="price">${p.price.toFixed(2)}</td>
                  <td className="date">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <span className="page-info">Page {pageNumber}</span>
        <button onClick={goPrev} disabled={isFirstPage || loading}>← Previous</button>
        <button onClick={goNext} disabled={!nextCursor || loading}>Next →</button>
      </div>
    </div>
  );
}
