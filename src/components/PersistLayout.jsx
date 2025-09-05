import React from 'react';
import { useLocation } from 'react-router-dom';
import AppContent from './AppContent';
import TgeContent from './TgeContent';

export default function PersistLayout() {
  const location = useLocation();
  
  // Render TGE content when on /tge route, otherwise render Airdrop content
  if (location.pathname === '/tge') {
    return <TgeContent />;
  }
  
  // Giữ AppContent luôn được mount để không reset state khi đổi route
  return <AppContent />;
}


