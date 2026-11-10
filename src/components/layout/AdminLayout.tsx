import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { adminApi } from '../../api/admin.api';

interface SearchResults {
  users: Array<{ id: number; firstName: string; lastName: string; email: string; role: { name: string } }>;
  pages: Array<{ id: number; title: string; slug: string }>;
  settings: Array<{ key: string; group: string; label: string }>;
}

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await adminApi.globalSearch(searchQuery.trim());
        if (res.data) {
          setSearchResults(res.data);
        }
      } catch {
        // silent fail for search
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const navGroups = [
    {
      groupTitle: 'الرئيسية والمؤشرات',
      items: [
        { to: '/admin', end: true, icon: '📊', label: 'لوحة المؤشرات المركزية' },
      ],
    },
    {
      groupTitle: 'إدارة المستخدمين والأذونات',
      items: [
        { to: '/admin/users', end: false, icon: '👥', label: 'المستخدمون والحسابات' },
        { to: '/admin/roles', end: false, icon: '🛡️', label: 'الأدوار والمصفوفة (RBAC)' },
      ],
    },
    {
      groupTitle: 'المحتوى والتواصل',
      items: [
        { to: '/admin/pages', end: false, icon: '📄', label: 'الصفحات العامة' },
        { to: '/admin/templates', end: false, icon: '📑', label: 'قوالب النظام (Templates)' },
        { to: '/admin/notifications', end: false, icon: '📣', label: 'مركز إرسال الإشعارات' },
      ],
    },
    {
      groupTitle: 'إعدادات وخدمات المنظومة',
      items: [
        { to: '/admin/settings', end: false, icon: '⚙️', label: 'إعدادات النظام (12 مجموعة)' },
        { to: '/admin/services', end: false, icon: '🔌', label: 'فحص وتكامل الخدمات' },
        { to: '/admin/backups', end: false, icon: '💾', label: 'النسخ الاحتياطي للنظام' },
        { to: '/admin/audit-logs', end: false, icon: '📜', label: 'سجلات التدقيق الأمني' },
        { to: '/admin/health', end: false, icon: '🩺', label: 'صحة وحالة الخادم' },
        { to: '/admin/advanced', end: false, icon: '⚡', label: 'إدارة النظام والجلسات المتقدمة' },
      ],
    },
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🏛️</span>
          <div>
            <span className="brand-text">لوحة إدارة المؤسسة</span>
            <small className="sidebar-version-badge">Enterprise v2.4</small>
          </div>
        </div>

        {/* Global Search Button in Sidebar */}
        <div className="sidebar-search-trigger" onClick={() => setSearchOpen(true)}>
          <span className="search-icon">🔍</span>
          <span className="search-placeholder">بحث سريع في النظام...</span>
          <kbd className="search-kbd">Ctrl+K</kbd>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group, idx) => (
            <div key={idx} className="sidebar-group">
              <span className="sidebar-group-title">{group.groupTitle}</span>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-external-link">
            <span>🌐</span> استعراض البوابة العامة
          </Link>
        </div>
      </aside>

      <div className="admin-main-wrap">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-search-btn"
              onClick={() => setSearchOpen(true)}
              title="البحث السريع (Ctrl + K)"
            >
              <span className="search-icon">🔍</span>
              <span>بحث سريع في المستخدمين، الصفحات، والإعدادات...</span>
              <kbd>Ctrl+K</kbd>
            </button>
          </div>

          <div className="topbar-right">
            {user ? (
              <div className="admin-user-profile">
                <div className="user-info">
                  <span className="user-name">{user.firstName} {user.lastName}</span>
                  <Badge variant={user.role.slug === 'super_admin' ? 'danger' : 'info'}>
                    {user.role.name}
                  </Badge>
                </div>
                <Link to="/user" className="btn btn-outline btn-sm">
                  بوابتي الشخصية
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-ghost btn-sm text-danger"
                  title="تسجيل الخروج"
                >
                  خروج
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main className="admin-content-area">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Search Modal (Appendix A.1) */}
      {searchOpen && (
        <div className="global-search-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <span className="search-modal-icon">🔍</span>
              <input
                type="text"
                className="search-modal-input"
                placeholder="ابحث عن مستخدم، بريد، صفحة، أو مفتاح إعدادات..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className="search-close-btn"
                onClick={() => setSearchOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="search-modal-body">
              {isSearching && (
                <div className="search-loading">
                  <div className="spinner-small" /> جاري البحث في المنظومة...
                </div>
              )}

              {!isSearching && searchResults && (
                <div className="search-results-list">
                  {/* Users */}
                  {searchResults.users.length > 0 && (
                    <div className="search-category">
                      <div className="search-category-title">
                        <span>👥 المستخدمون والحسابات</span>
                        <span className="badge-count">{searchResults.users.length}</span>
                      </div>
                      {searchResults.users.map((u) => (
                        <div
                          key={u.id}
                          className="search-result-item"
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/admin/users');
                          }}
                        >
                          <div className="item-main">
                            <strong>{u.firstName} {u.lastName}</strong>
                            <small className="text-muted">{u.email}</small>
                          </div>
                          <Badge variant="info">{u.role.name}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pages */}
                  {searchResults.pages.length > 0 && (
                    <div className="search-category">
                      <div className="search-category-title">
                        <span>📄 الصفحات العامة</span>
                        <span className="badge-count">{searchResults.pages.length}</span>
                      </div>
                      {searchResults.pages.map((p) => (
                        <div
                          key={p.id}
                          className="search-result-item"
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/admin/pages');
                          }}
                        >
                          <div className="item-main">
                            <strong>{p.title}</strong>
                            <small className="text-muted">/{p.slug}</small>
                          </div>
                          <Badge variant="success">صفحة عامة</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Settings */}
                  {searchResults.settings.length > 0 && (
                    <div className="search-category">
                      <div className="search-category-title">
                        <span>⚙️ إعدادات النظام</span>
                        <span className="badge-count">{searchResults.settings.length}</span>
                      </div>
                      {searchResults.settings.map((s) => (
                        <div
                          key={s.key}
                          className="search-result-item"
                          onClick={() => {
                            setSearchOpen(false);
                            navigate('/admin/settings');
                          }}
                        >
                          <div className="item-main">
                            <strong>{s.label}</strong>
                            <small className="text-muted">{s.key} • {s.group}</small>
                          </div>
                          <Badge variant="warning">{s.group}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.users.length === 0 &&
                    searchResults.pages.length === 0 &&
                    searchResults.settings.length === 0 && (
                      <div className="search-empty">
                        <p>لم يتم العثور على أية نتائج مطابقة لـ "{searchQuery}"</p>
                      </div>
                    )}
                </div>
              )}

              {!isSearching && !searchResults && (
                <div className="search-tips">
                  <p className="tips-title">نصائح البحث السريع:</p>
                  <ul>
                    <li>اكتب اسم مستخدم أو جزءاً من بريده الإلكتروني</li>
                    <li>اكتب اسم صفحة مثل <code>اتصل بنا</code> أو <code>الرئيسية</code></li>
                    <li>اكتب مفتاح إعداد مثل <code>smtp</code> أو <code>maintenance</code></li>
                    <li>اضغط <kbd>Esc</kbd> للإغلاق في أي وقت</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
