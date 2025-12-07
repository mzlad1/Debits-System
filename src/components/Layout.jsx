import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const [theme, setTheme] = useState("dark");
  const navigate = useNavigate();
  const location = useLocation();

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">نظام إدارة الديون</div>
          <div className="flex items-center gap-md">
            <button
              onClick={() => navigate("/")}
              className={`btn ${
                location.pathname === "/" ? "btn-primary" : "btn-secondary"
              }`}
              style={{ fontSize: "0.875rem" }}
            >
              الزبائن
            </button>
            <button
              onClick={() => navigate("/sms")}
              className={`btn ${
                location.pathname === "/sms" ? "btn-primary" : "btn-secondary"
              }`}
              style={{ fontSize: "0.875rem" }}
            >
              📱 إرسال SMS
            </button>
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={theme === "dark" ? "وضع فاتح" : "وضع داكن"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <span className="text-muted" style={{ fontSize: "0.875rem" }}>
              {user?.email}
            </span>
            <button onClick={handleLogout} className="btn btn-secondary">
              تسجيل الخروج
            </button>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
};

export default Layout;
