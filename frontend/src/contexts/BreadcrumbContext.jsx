import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BreadcrumbContext = createContext();

export function BreadcrumbProvider({ children }) {
  const [customCrumbs, setCustomCrumbs] = useState(null);
  const location = useLocation();

  // Reset custom crumbs on route change
  useEffect(() => {
    setCustomCrumbs(null);
  }, [location.pathname]);

  const setBreadcrumbs = useCallback((crumbs) => {
    setCustomCrumbs(crumbs);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ customCrumbs, setBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  return ctx;
}
