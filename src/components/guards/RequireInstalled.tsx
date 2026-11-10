import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { installApi } from '../../api/install.api';

export const RequireInstalled: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    installApi
      .getStatus()
      .then((res) => {
        if (isMounted && res.data) {
          setIsInstalled(res.data.isInstalled);
        }
      })
      .catch(() => {
        if (isMounted) setIsInstalled(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isInstalled === null) {
    return (
      <div className="page-loader">
        <div className="spinner-large" />
      </div>
    );
  }

  const isInstallPath = location.pathname === '/install';

  if (!isInstalled && !isInstallPath) {
    return <Navigate to="/install" replace />;
  }

  if (isInstalled && isInstallPath) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
