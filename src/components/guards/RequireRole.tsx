import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export interface RequireRoleProps {
  allowedRoles?: string[];
  requiredPermission?: string;
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles,
  requiredPermission,
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="spinner-large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // super_admin has master access
  if (user.role.slug === 'super_admin') {
    return <>{children}</>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role.slug)) {
    return <Navigate to={user.role.slug === 'user' ? '/user' : '/admin'} replace />;
  }

  if (requiredPermission && !user.permissions.includes(requiredPermission)) {
    return (
      <div className="empty-state">
        <h2>وصول محظور (403)</h2>
        <p>لا تمتلك الصلاحية المطلوبة للوصول إلى هذا القسم.</p>
      </div>
    );
  }

  return <>{children}</>;
};
