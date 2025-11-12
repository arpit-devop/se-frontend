import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

const API_BASE =
  (process.env.REACT_APP_BACKEND_URL &&
    process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "")) ||
  "http://localhost:8000";

const AUTH_STORAGE_KEY = "pharmaventory_session";

function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, variant = "info") => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 4000);
  };

  return { toast, showToast };
}

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authValues, setAuthValues] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "pharmacist"
  });
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [medicineForm, setMedicineForm] = useState({
    name: "",
    generic_name: "",
    category: "",
    manufacturer: "",
    quantity: 0,
    unit: "units",
    reorder_level: 10,
    unit_price: 0,
    batch_number: "",
    expiry_date: dayjs().add(6, "month").format("YYYY-MM-DD"),
    location: "",
    description: ""
  });
  const { toast, showToast } = useToast();

  const authenticated = Boolean(token);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const payload = JSON.parse(stored);
        if (payload.token) {
          setToken(payload.token);
          setUser(payload.user || null);
        }
      } catch (error) {
        console.error("Failed to parse stored session", error);
      }
    }
  }, []);

  const safeJson = async (response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const fetchWithAuth = useMemo(() => {
    return async (path, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        const detail = await safeJson(response);
        const errorMessage =
          detail?.detail ||
          detail?.message ||
          `Request failed (${response.status})`;
        throw new Error(errorMessage);
      }
      if (response.status === 204) {
        return null;
      }
      return response.json();
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchData = async () => {
      await Promise.all([fetchProfile(), fetchMedicines(), fetchAnalytics()]);
    };

    fetchData().catch((error) => {
      console.error(error);
      showToast("Failed to refresh data", "error");
    });
  }, [token]);

  const fetchProfile = async () => {
    const profile = await fetchWithAuth("/api/auth/me");
    setUser(profile);
    window.sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token, user: profile })
    );
  };

  const fetchMedicines = async () => {
    const items = await fetchWithAuth("/api/medicines");
    setMedicines(items);
  };

  const fetchAnalytics = async () => {
    const data = await fetchWithAuth("/api/analytics/dashboard");
    setAnalytics(data);
  };

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthValues((current) => ({ ...current, [name]: value }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload =
        authMode === "register"
          ? {
              email: authValues.email,
              password: authValues.password,
              full_name: authValues.full_name,
              role: authValues.role
            }
          : {
              email: authValues.email,
              password: authValues.password
            };

      const endpoint =
        authMode === "register" ? "/api/auth/register" : "/api/auth/login";

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const detail = await safeJson(response);
        throw new Error(detail?.detail || "Authentication failed");
      }

      const result = await response.json();
      setToken(result.access_token);
      setUser(result.user);
      window.sessionStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ token: result.access_token, user: result.user })
      );
      showToast(
        authMode === "register"
          ? "Registration successful"
          : "Logged in successfully"
      );
      setAuthValues((current) => ({ ...current, password: "" }));
    } catch (error) {
      console.error(error);
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setToken("");
    setUser(null);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setMedicines([]);
    setAnalytics(null);
    showToast("You have signed out.");
  };

  const handleMedicineChange = (event) => {
    const { name, value } = event.target;
    setMedicineForm((current) => ({
      ...current,
      [name]:
        name === "quantity" ||
        name === "reorder_level" ||
        name === "unit_price"
          ? Number(value)
          : value
    }));
  };

  const handleCreateMedicine = async (event) => {
    event.preventDefault();
    if (!authenticated) {
      showToast("Please login first", "error");
      return;
    }
    try {
      await fetchWithAuth("/api/medicines", {
        method: "POST",
        body: JSON.stringify({
          ...medicineForm,
          expiry_date: dayjs(medicineForm.expiry_date).toISOString()
        })
      });
      showToast("Medicine added");
      await fetchMedicines();
      setMedicineForm((current) => ({
        ...current,
        name: "",
        generic_name: "",
        category: "",
        manufacturer: "",
        quantity: 0,
        reorder_level: 10,
        unit_price: 0,
        batch_number: "",
        location: "",
        description: ""
      }));
    } catch (error) {
      console.error(error);
      showToast(error.message, "error");
    }
  };

  const lowStock = useMemo(() => analytics?.low_stock_items || [], [analytics]);
  const expiringSoon = useMemo(
    () => analytics?.expiring_soon_items || [],
    [analytics]
  );

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1>Pharmaventory</h1>
          <p className="muted">
            Smart inventory, prescription, and reorder management built with
            FastAPI + React.
          </p>
        </div>
        {authenticated ? (
          <div className="stack" style={{ alignItems: "flex-end" }}>
            <span className="tag">
              <strong>{user?.full_name || user?.email}</strong>
              <span>{user?.role}</span>
            </span>
            <button className="button secondary" onClick={signOut}>
              Sign out
            </button>
          </div>
        ) : null}
      </header>

      {!authenticated ? (
        <section className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="flex-between">
            <h2 style={{ margin: 0 }}>
              {authMode === "login" ? "Welcome back 👋" : "Create an account"}
            </h2>
            <button
              className="button secondary"
              onClick={() =>
                setAuthMode((current) =>
                  current === "login" ? "register" : "login"
                )
              }
            >
              Switch to {authMode === "login" ? "register" : "login"}
            </button>
          </div>
          <form className="grid" style={{ marginTop: 24 }} onSubmit={handleAuthSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={authValues.email}
                onChange={handleAuthChange}
                placeholder="you@pharmaventory.dev"
              />
            </div>
            {authMode === "register" ? (
              <>
                <div className="input-group">
                  <label htmlFor="full_name">Full name</label>
                  <input
                    id="full_name"
                    name="full_name"
                    required
                    value={authValues.full_name}
                    onChange={handleAuthChange}
                    placeholder="Jordan Pharmacist"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={authValues.role}
                    onChange={handleAuthChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="supplier">Supplier</option>
                  </select>
                </div>
              </>
            ) : null}
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={authValues.password}
                onChange={handleAuthChange}
                placeholder="••••••••"
              />
            </div>
            <button className="button" type="submit" disabled={loading}>
              {loading
                ? "Processing..."
                : authMode === "login"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>
        </section>
      ) : (
        <main className="grid" style={{ gap: 32 }}>
          <section className="grid two-columns">
            <article className="card">
              <h2 style={{ marginTop: 0 }}>Inventory</h2>
              <p className="muted">
                Track medicines, quantities, and expiry with AI-assisted
                monitoring.
              </p>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th>Expiry</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((medicine) => (
                    <tr key={medicine.id}>
                      <td>
                        <strong>{medicine.name}</strong>
                        <div className="muted">{medicine.generic_name}</div>
                      </td>
                      <td>
                        <span className="tag">
                          {medicine.quantity} {medicine.unit}
                        </span>
                      </td>
                      <td>{dayjs(medicine.expiry_date).format("MMM D, YYYY")}</td>
                      <td>{medicine.category}</td>
                    </tr>
                  ))}
                  {medicines.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted">
                        No medicines yet. Add your first item below.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </article>
            <article className="card">
              <h2 style={{ marginTop: 0 }}>Add medicine</h2>
              <form className="grid" onSubmit={handleCreateMedicine}>
                <div className="input-group">
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    name="name"
                    required
                    value={medicineForm.name}
                    onChange={handleMedicineChange}
                    placeholder="Amoxicillin 500mg"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="generic_name">Generic name</label>
                  <input
                    id="generic_name"
                    name="generic_name"
                    required
                    value={medicineForm.generic_name}
                    onChange={handleMedicineChange}
                    placeholder="Amoxicillin"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="category">Category</label>
                  <input
                    id="category"
                    name="category"
                    required
                    value={medicineForm.category}
                    onChange={handleMedicineChange}
                    placeholder="Antibiotic"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="manufacturer">Manufacturer</label>
                  <input
                    id="manufacturer"
                    name="manufacturer"
                    value={medicineForm.manufacturer}
                    onChange={handleMedicineChange}
                    placeholder="Pharma Inc."
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="quantity">Quantity</label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={medicineForm.quantity}
                    onChange={handleMedicineChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="unit">Unit</label>
                  <input
                    id="unit"
                    name="unit"
                    value={medicineForm.unit}
                    onChange={handleMedicineChange}
                    placeholder="boxes"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="unit_price">Unit price</label>
                  <input
                    id="unit_price"
                    name="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={medicineForm.unit_price}
                    onChange={handleMedicineChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="reorder_level">Reorder level</label>
                  <input
                    id="reorder_level"
                    name="reorder_level"
                    type="number"
                    min="0"
                    value={medicineForm.reorder_level}
                    onChange={handleMedicineChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="batch_number">Batch number</label>
                  <input
                    id="batch_number"
                    name="batch_number"
                    value={medicineForm.batch_number}
                    onChange={handleMedicineChange}
                    placeholder="AMX-2025-001"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="expiry_date">Expiry date</label>
                  <input
                    id="expiry_date"
                    name="expiry_date"
                    type="date"
                    required
                    value={medicineForm.expiry_date}
                    onChange={handleMedicineChange}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="location">Storage location</label>
                  <input
                    id="location"
                    name="location"
                    value={medicineForm.location}
                    onChange={handleMedicineChange}
                    placeholder="Cold storage"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="description">Notes</label>
                  <input
                    id="description"
                    name="description"
                    value={medicineForm.description}
                    onChange={handleMedicineChange}
                    placeholder="Optional notes"
                  />
                </div>
                <button className="button" type="submit">
                  Add to inventory
                </button>
              </form>
            </article>
          </section>

          {analytics ? (
            <section className="grid two-columns">
              <article className="card">
                <h2 style={{ marginTop: 0 }}>Stock health</h2>
                <ul className="list">
                  <li className="flex-between">
                    <span>Total medicines</span>
                    <strong>{analytics.total_medicines}</strong>
                  </li>
                  <li className="flex-between">
                    <span>Total inventory value</span>
                    <strong>${analytics.total_value}</strong>
                  </li>
                  <li className="flex-between">
                    <span>Low stock</span>
                    <span className="status-pill pill-yellow">
                      {analytics.low_stock_count}
                    </span>
                  </li>
                  <li className="flex-between">
                    <span>Expiring soon</span>
                    <span className="status-pill pill-red">
                      {analytics.expiring_soon_count}
                    </span>
                  </li>
                  <li className="flex-between">
                    <span>Expired items</span>
                    <span className="status-pill pill-red">
                      {analytics.expired_count}
                    </span>
                  </li>
                </ul>
              </article>
              <article className="card">
                <h2 style={{ marginTop: 0 }}>Attention needed</h2>
                <div className="stack">
                  <div>
                    <h3>Low stock</h3>
                    <ul className="list">
                      {lowStock.length === 0 ? (
                        <li className="muted">All good for now 🙌</li>
                      ) : (
                        lowStock.map((item) => (
                          <li key={item.id}>
                            <div className="flex-between">
                              <strong>{item.name}</strong>
                              <span className="status-pill pill-yellow">
                                {item.quantity} left
                              </span>
                            </div>
                            <div className="muted">
                              Reorder at {item.reorder_level} units
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3>Expiring soon</h3>
                    <ul className="list">
                      {expiringSoon.length === 0 ? (
                        <li className="muted">No items expiring soon 🎉</li>
                      ) : (
                        expiringSoon.map((item) => (
                          <li key={item.id}>
                            <div className="flex-between">
                              <strong>{item.name}</strong>
                              <span className="status-pill pill-red">
                                {dayjs(item.expiry_date).format("MMM D")}
                              </span>
                            </div>
                            <div className="muted">{item.category}</div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </article>
            </section>
          ) : null}
        </main>
      )}

      {toast ? (
        <div className={`toast ${toast.variant === "error" ? "error" : ""}`}>
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}

export default App;

