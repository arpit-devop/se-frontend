import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

const API_BASE =
  (process.env.REACT_APP_BACKEND_URL &&
    process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, "")) ||
  "https://se-project-kp2e.onrender.com";

// Remove /api from API_BASE if present (endpoints already include /api)
const cleanApiBase = API_BASE.replace(/\/api\/?$/, "");

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
  const [authMode, setAuthMode] = useState(null);
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
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

  // Reset auth mode when logging out
  useEffect(() => {
    if (!authenticated) {
      setAuthMode(null);
    }
  }, [authenticated]);

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

      const response = await fetch(`${cleanApiBase}${path}`, {
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

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchData = async () => {
      try {
        await Promise.all([fetchProfile(), fetchMedicines(), fetchAnalytics()]);
      } catch (error) {
        console.error("Fetch data error:", error);
        // Don't show toast for initial load errors, just log
      }
    };

    fetchData();
  }, [token]);

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

      const response = await fetch(`${cleanApiBase}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
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

  // Get current date
  const currentDate = dayjs().format("dddd, MMMM D, YYYY");
  const greeting = `Hey, ${user?.full_name?.split(" ")[0] || "User"}`;

  // Filter medicines based on search
  const filteredMedicines = medicines.filter((med) =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.generic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      {!authenticated ? (
        <>
          {/* Landing Page */}
          <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-navbar">
              <div className="navbar-left">
                <div className="logo">
                  <div className="logo-icon">💊</div>
                  <span className="logo-text">Pharmaventory</span>
                </div>
              </div>
              <div className="navbar-center">
                <a href="#home" className="nav-link">Home</a>
                <a href="#about" className="nav-link">About</a>
                <a href="#features" className="nav-link">Features</a>
                <a href="#pricing" className="nav-link">Pricing</a>
                <a href="#contact" className="nav-link">Contact</a>
              </div>
              <div className="navbar-right">
                <button className="btn-get-started" onClick={() => setAuthMode("login")}>
                  Get Started
                </button>
                <div className="user-avatar-small">
                  <span>U</span>
                </div>
              </div>
            </nav>

            {/* Hero Section */}
            <div className="hero-section">
              <div className="hero-content">
                <p className="hero-subtitle">Optimize Growth</p>
                <h1 className="hero-heading">
                  Streamline Your Goals with Our KPI & Project Management Platform
                </h1>
                <p className="hero-description">
                  Our innovative platform offers a robust solution to help you stay organized, focused, and on track to achieve your strategic objectives.
                </p>
                <div className="hero-buttons">
                  <button className="btn-try-free" onClick={() => setAuthMode("login")}>
                    Try it free
                  </button>
                  <button className="btn-register" onClick={() => setAuthMode("register")}>
                    Register
                  </button>
                </div>
                <div className="hero-icons">
                  <div className="icon-box">📊</div>
                  <div className="icon-box">💾</div>
                  <div className="icon-box">⭐</div>
                  <div className="icon-box">🚀</div>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="dashboard-preview">
              <div className="preview-card">
                <div className="preview-sidebar">
                  <div className="preview-logo-small">💊 Pharmaventory</div>
                  <div className="preview-nav-active">Dashboard</div>
                </div>
                <div className="preview-main">
                  <div className="preview-topbar">
                    <div className="preview-greeting">
                      <span>Hey, {user?.full_name?.split(" ")[0] || "User"}</span>
                      <span className="preview-date">{currentDate}</span>
                    </div>
                    <div className="preview-search">🔍 Q Start searching here...</div>
                    <div className="preview-icons">
                      <span>⚙️</span>
                      <span>🔔</span>
                      <span className="preview-avatar">U</span>
                    </div>
                  </div>
                  <div className="preview-content">
                    <div className="preview-alert-card">
                      <div className="preview-alert-icon">🔔</div>
                      <div className="preview-alert-text">
                        <strong>Attention Required:</strong> You have {analytics?.low_stock_count || 0} low stock items and {analytics?.expiring_soon_count || 0} items expiring soon.
                      </div>
                      <button className="preview-btn">View Detail</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Auth Modal */}
            {authMode !== null && (
              <div className="auth-modal-overlay" onClick={() => setAuthMode(null)}>
                <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>{authMode === "login" ? "Welcome back 👋" : "Create an account"}</h2>
                    <button className="modal-close" onClick={() => setAuthMode(null)}>×</button>
                  </div>
                  <form className="auth-form" onSubmit={handleAuthSubmit}>
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
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="dashboard-layout">
          {/* Sidebar */}
          <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
            <div className="sidebar-header">
              <h2 className="sidebar-title">Dashboard</h2>
            </div>
            <nav className="sidebar-nav">
              <button
                className={`nav-item ${activeSection === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveSection("dashboard")}
              >
                <span className="nav-icon">📊</span>
                <span>Dashboard</span>
              </button>
              <button
                className={`nav-item ${activeSection === "inventory" ? "active" : ""}`}
                onClick={() => setActiveSection("inventory")}
              >
                <span className="nav-icon">📦</span>
                <span>Inventory</span>
              </button>
              <button
                className={`nav-item ${activeSection === "prescriptions" ? "active" : ""}`}
                onClick={() => setActiveSection("prescriptions")}
              >
                <span className="nav-icon">💊</span>
                <span>Prescriptions</span>
              </button>
              <button
                className={`nav-item ${activeSection === "analytics" ? "active" : ""}`}
                onClick={() => setActiveSection("analytics")}
              >
                <span className="nav-icon">📈</span>
                <span>Analytics</span>
              </button>
              <button
                className={`nav-item ${activeSection === "reorders" ? "active" : ""}`}
                onClick={() => setActiveSection("reorders")}
              >
                <span className="nav-icon">🔄</span>
                <span>Reorders</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="dashboard-main">
            {/* Top Bar */}
            <header className="dashboard-topbar">
              <div className="topbar-left">
                <h1 className="dashboard-logo">Pharmaventory</h1>
                <div className="greeting-section">
                  <span className="greeting">{greeting}</span>
                  <span className="date">{currentDate}</span>
                </div>
              </div>
              <div className="topbar-center">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Start searching here..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              <div className="topbar-right">
                <button className="icon-button">⚙️</button>
                <button className="icon-button">🔔</button>
                <div className="user-avatar" onClick={signOut}>
                  <span>{user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}</span>
                </div>
              </div>
            </header>

            {/* Dashboard Content */}
            <div className="dashboard-content">
              {/* Alert Card */}
              {analytics && (analytics.low_stock_count > 0 || analytics.expiring_soon_count > 0) && (
                <div className="alert-card">
                  <div className="alert-icon">🔔</div>
                  <div className="alert-content">
                    <p>
                      <strong>Attention Required:</strong> You have{" "}
                      {analytics.low_stock_count} low stock items and{" "}
                      {analytics.expiring_soon_count} items expiring soon.
                    </p>
                  </div>
                  <button className="button alert-button">View Details</button>
                </div>
              )}

              {/* KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-icon">💊</div>
                  <div className="kpi-content">
                    <h3>Total Medicines</h3>
                    <p className="kpi-value">{analytics?.total_medicines || medicines.length}</p>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon">⚠️</div>
                  <div className="kpi-content">
                    <h3>Low Stock Items</h3>
                    <p className="kpi-value">{analytics?.low_stock_count || 0}</p>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon">⏰</div>
                  <div className="kpi-content">
                    <h3>Expiring Soon</h3>
                    <p className="kpi-value">{analytics?.expiring_soon_count || 0}</p>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon">💰</div>
                  <div className="kpi-content">
                    <h3>Inventory Value</h3>
                    <p className="kpi-value">${analytics?.total_value || "0.00"}</p>
                  </div>
                </div>
              </div>

              {/* Main Content Sections */}
              {activeSection === "dashboard" && (
                <>
                  <div className="content-grid">
                    <article className="dashboard-card">
                      <div className="card-header">
                        <h2>On Going Tasks</h2>
                        <p className="card-subtitle">Best performing inventory items</p>
                      </div>
                      <div className="card-content">
                        {filteredMedicines.slice(0, 5).map((medicine) => (
                          <div key={medicine.id} className="task-item">
                            <div className="task-info">
                              <strong>{medicine.name}</strong>
                              <span className="muted">{medicine.category}</span>
                            </div>
                            <div className="task-status">
                              <span className="status-pill pill-green">
                                {medicine.quantity} {medicine.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                        {filteredMedicines.length === 0 && (
                          <p className="muted">No medicines found</p>
                        )}
                      </div>
                    </article>

                    <article className="dashboard-card">
                      <div className="card-header">
                        <h2>Graphs and Analysis</h2>
                        <p className="card-subtitle">Inventory trends and statistics</p>
                      </div>
                      <div className="card-content">
                        <div className="chart-placeholder">
                          <div className="chart-bar" style={{ height: "60%" }}>
                            <span>Total Medicines</span>
                            <span>{analytics?.total_medicines || 0}</span>
                          </div>
                          <div className="chart-bar" style={{ height: "40%" }}>
                            <span>Low Stock</span>
                            <span>{analytics?.low_stock_count || 0}</span>
                          </div>
                          <div className="chart-bar" style={{ height: "30%" }}>
                            <span>Expiring</span>
                            <span>{analytics?.expiring_soon_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                </>
              )}

              {activeSection === "inventory" && (
                <div className="content-section">
                  <div className="content-grid">
                    <article className="dashboard-card full-width">
                      <div className="card-header">
                        <h2>Inventory</h2>
                        <p className="card-subtitle">
                          Track medicines, quantities, and expiry with AI-assisted monitoring.
                        </p>
                      </div>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Quantity</th>
                            <th>Expiry</th>
                            <th>Category</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMedicines.map((medicine) => (
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
                              <td>
                                {medicine.quantity <= (medicine.reorder_level || 10) ? (
                                  <span className="status-pill pill-yellow">Low Stock</span>
                                ) : (
                                  <span className="status-pill pill-green">In Stock</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {filteredMedicines.length === 0 && (
                            <tr>
                              <td colSpan={5} className="muted">
                                No medicines found. {searchQuery ? "Try a different search." : "Add your first item below."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </article>
                  </div>
                  <article className="dashboard-card">
                    <div className="card-header">
                      <h2>Add Medicine</h2>
                    </div>
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
                </div>
              )}

              {activeSection === "analytics" && analytics && (
                <div className="content-section">
                  <div className="content-grid">
                    <article className="dashboard-card">
                      <div className="card-header">
                        <h2>Stock Health</h2>
                      </div>
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
                    <article className="dashboard-card">
                      <div className="card-header">
                        <h2>Attention Needed</h2>
                      </div>
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
                  </div>
                </div>
              )}

              {(activeSection === "prescriptions" || activeSection === "reorders") && (
                <div className="content-section">
                  <article className="dashboard-card full-width">
                    <div className="card-header">
                      <h2>{activeSection === "prescriptions" ? "Prescriptions" : "Reorders"}</h2>
                      <p className="card-subtitle">Coming soon...</p>
                    </div>
                  </article>
                </div>
              )}
            </div>
          </main>
        </div>
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

