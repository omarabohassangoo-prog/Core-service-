import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const UserLayout: React.FC = () => {
  const { user, logout } = useAuth();

  const isStaff = user && ['super_admin', 'admin', 'editor'].includes(user.role.slug);

  return (
    <div className="user-shell">
      <header className="user-topbar">
        <div className="container user-topbar-inner">
          <Link to="/user" className="brand-logo">
            <span className="brand-icon">👤</span>
            <span className="brand-text">بوابة المستخدم الشخصية</span>
          </Link>

          <nav className="user-nav">
            <NavLink
              to="/user"
              end
              className={({ isActive }) => `user-nav-link ${isActive ? 'active' : ''}`}
            >
              الرئيسية
            </NavLink>
            <NavLink
              to="/user/profile"
              className={({ isActive }) => `user-nav-link ${isActive ? 'active' : ''}`}
            >
              الملف الشخصي
            </NavLink>
            <NavLink
              to="/user/notifications"
              className={({ isActive }) => `user-nav-link ${isActive ? 'active' : ''}`}
            >
              الإشعارات
            </NavLink>
          </nav>

          <div className="user-topbar-actions">
            {isStaff ? (
              <Link to="/admin" className="btn btn-outline btn-sm">
                لوحة الإدارة
              </Link>
            ) : null}
            <Link to="/" className="btn btn-ghost btn-sm">
              الموقع العام
            </Link>
            <button
              type="button"
              onClick={logout}
              className="btn btn-ghost btn-sm text-danger"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="user-main container">
        <Outlet />
      </main>
    </div>
  );
};
