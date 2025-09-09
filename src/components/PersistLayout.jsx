import React, { useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';

export default function PersistLayout() {
  const location = useLocation();
  
  // Fetch data when route changes
  useEffect(() => {
    console.log('Route changed to:', location.pathname);
    
    // Clear any existing auto-refresh intervals when switching pages
    if (window.fullInfoRefreshInterval) {
      console.log('🔄 Clearing Airdrop auto-refresh interval on route change');
      clearInterval(window.fullInfoRefreshInterval);
      window.fullInfoRefreshInterval = null;
    }
    
    if (window.tgeFullInfoRefreshInterval) {
      console.log('🔄 Clearing TGE auto-refresh interval on route change');
      clearInterval(window.tgeFullInfoRefreshInterval);
      window.tgeFullInfoRefreshInterval = null;
    }
    
    // Trigger a refresh when switching routes
    if (location.pathname === '/tge') {
      console.log('Switched to TGE route - data will be refreshed');
    } else {
      console.log('Switched to Airdrop route - data will be refreshed');
    }
  }, [location.pathname]);
  
  // Sử dụng Outlet để render child routes thay vì render trực tiếp
  return <Outlet />;
}


