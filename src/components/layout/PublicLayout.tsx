import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../context/SettingsContext';

export const PublicLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const { settings, get } = useSettings();
  const siteName = get('general.siteName', get('general.site_name', 'Enterprise Core'));

  const defaults = [
    { slug: 'home', to: '/', label: 'الرئيسية' },
    { slug: 'about', to: '/about', label: 'من نحن' },
    { slug: 'services', to: '/services', label: 'خدماتنا' },
    { slug: 'faq', to: '/faq', label: 'الأسئلة الشائعة' },
    { slug: 'terms', to: '/terms', label: 'الشروط والخصوصية' },
    { slug: 'contact', to: '/contact', label: 'اتصل بنا' },
  ];
  const navLinks = defaults.filter((link) => settings.pages[link.slug]?.enabled !== 'false' && settings.pages[link.slug]?.showInNav !== 'false').map((link) => ({
    ...link,
    label: settings.pages[link.slug]?.navLabel || settings.pages[link.slug]?.navLabelAr || link.label,
  }));

  return (
    <div className="layout-root">
      <header className="public-header">
        <div className="container header-container">
          <Link to="/" className="brand-logo">
            <span className="brand-icon">🏛</span>
            <span className="brand-text">{siteName}</span>
          </Link>

          <nav className="public-nav">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            {isAuthenticated && user ? (
              <div className="user-quick-menu">
                <Link
                  to={['super_admin', 'admin', 'editor'].includes(user.role.slug) ? '/admin' : '/user'}
                  className="btn btn-outline btn-sm"
                >
                  لوحة التحكم ({user.firstName})
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-ghost btn-sm text-danger"
                >
                  خروج
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  تسجيل الدخول
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  حساب جديد
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="container footer-container">
          <div className="footer-col">
            <div className="brand-logo footer-logo">
              <span className="brand-icon">🏛</span>
              <span className="brand-text">{siteName}</span>
            </div>
            <p className="footer-desc">
              نظام Enterprise متكامل متعدد الوحدات مبني وفق معايير الحماية والأداء المؤسسي.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">روابط سريعة</h4>
            <ul className="footer-links">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">بوابات النظام</h4>
            <ul className="footer-links">
              <li><Link to="/login">تسجيل دخول المستخدمين</Link></li>
              <li><Link to="/admin">بوابة الإدارة المركزية</Link></li>
              <li><Link to="/user">منطقة المستخدم</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>© {new Date().getFullYear()} {siteName}. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
