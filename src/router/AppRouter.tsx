import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Guards
import { PublicLayout } from '../components/layout/PublicLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { UserLayout } from '../components/layout/UserLayout';
import { RequireAuth } from '../components/guards/RequireAuth';
import { RequireRole } from '../components/guards/RequireRole';
import { RequireInstalled } from '../components/guards/RequireInstalled';

// System 1: Installation
import { InstallPage } from '../pages/install/InstallPage';

// System 2: Public Pages
import { HomePage } from '../pages/public/HomePage';
import { AboutPage } from '../pages/public/AboutPage';
import { ServicesPage } from '../pages/public/ServicesPage';
import { FaqPage } from '../pages/public/FaqPage';
import { TermsPage } from '../pages/public/TermsPage';
import { ContactPage } from '../pages/public/ContactPage';

// System 3: Authentication
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

// System 4: Admin Dashboard
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { UsersManagementPage } from '../pages/admin/UsersManagementPage';
import { RolesManagementPage } from '../pages/admin/RolesManagementPage';
import { SettingsPage } from '../pages/admin/SettingsPage';
import { PagesManagementPage } from '../pages/admin/PagesManagementPage';
import { ServicesTestingPage } from '../pages/admin/ServicesTestingPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';
import { SystemHealthPage } from '../pages/admin/SystemHealthPage';
import { BackupsPage } from '../pages/admin/BackupsPage';
import { TemplatesPage } from '../pages/admin/TemplatesPage';
import { NotificationsManagementPage } from '../pages/admin/NotificationsManagementPage';
import { SystemAdvancedPage } from '../pages/admin/SystemAdvancedPage';

// System 5: User Dashboard
import { UserDashboardPage } from '../pages/user/UserDashboardPage';
import { UserProfilePage } from '../pages/user/UserProfilePage';
import { UserNotificationsPage } from '../pages/user/UserNotificationsPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* System 1: Installation */}
      <Route
        path="/install"
        element={
          <RequireInstalled>
            <InstallPage />
          </RequireInstalled>
        }
      />

      {/* System 2: Public Pages */}
      <Route
        element={
          <RequireInstalled>
            <PublicLayout />
          </RequireInstalled>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* System 3: Authentication */}
      <Route
        path="/login"
        element={
          <RequireInstalled>
            <LoginPage />
          </RequireInstalled>
        }
      />
      <Route
        path="/register"
        element={
          <RequireInstalled>
            <RegisterPage />
          </RequireInstalled>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <RequireInstalled>
            <ForgotPasswordPage />
          </RequireInstalled>
        }
      />
      <Route
        path="/reset-password"
        element={
          <RequireInstalled>
            <ResetPasswordPage />
          </RequireInstalled>
        }
      />

      {/* System 4: Admin Dashboard (Protected by RequireAuth & RequireRole) */}
      <Route
        path="/admin"
        element={
          <RequireInstalled>
            <RequireAuth>
              <RequireRole allowedRoles={['super_admin', 'admin', 'editor']}>
                <AdminLayout />
              </RequireRole>
            </RequireAuth>
          </RequireInstalled>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<UsersManagementPage />} />
        <Route path="roles" element={<RolesManagementPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="pages" element={<PagesManagementPage />} />
        <Route path="services" element={<ServicesTestingPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="health" element={<SystemHealthPage />} />
        <Route path="backups" element={<BackupsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="notifications" element={<NotificationsManagementPage />} />
        <Route path="advanced" element={<SystemAdvancedPage />} />
      </Route>

      {/* System 5: User Dashboard (Protected by RequireAuth) */}
      <Route
        path="/user"
        element={
          <RequireInstalled>
            <RequireAuth>
              <UserLayout />
            </RequireAuth>
          </RequireInstalled>
        }
      >
        <Route index element={<UserDashboardPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="notifications" element={<UserNotificationsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
