import React, { createContext, useContext, useState } from 'react';
import { AUTO_REFRESH_INTERVAL } from '../utils/constants';

const AutoRefreshContext = createContext();

export const useAutoRefreshContext = () => {
  const context = useContext(AutoRefreshContext);
  if (!context) {
    throw new Error('useAutoRefreshContext must be used within an AutoRefreshProvider');
  }
  return context;
};

export const AutoRefreshProvider = ({ children }) => {
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true); // Auto-enable
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL); // Use constant

  const toggleAutoRefresh = () => {
    // Disabled - auto-refresh is always on
    console.log('Auto-refresh toggle disabled - always enabled');
  };

  const updateCountdown = (newCountdown) => {
    setCountdown(newCountdown);
  };

  const value = {
    isAutoRefreshEnabled,
    countdown,
    toggleAutoRefresh,
    updateCountdown
  };

  return (
    <AutoRefreshContext.Provider value={value}>
      {children}
    </AutoRefreshContext.Provider>
  );
};
