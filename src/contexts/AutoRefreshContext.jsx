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
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true); // Re-enabled auto refresh
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL); // Use constant

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(prev => !prev);
    console.log('Auto-refresh toggled:', !isAutoRefreshEnabled);
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
