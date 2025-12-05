import React from 'react'
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">نظام إدارة الديون</div>
          <div className="flex items-center gap-md">
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>
              {user?.email}
            </span>
            <button onClick={handleLogout} className="btn btn-secondary">
              تسجيل الخروج
            </button>
          </div>
        </div>
      </nav>
      <main>
        {children}
      </main>
    </>
  );
};

export default Layout;
