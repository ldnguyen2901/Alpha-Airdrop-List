import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './RouteToggle.css';

export default function RouteToggle() {
  const location = useLocation();
  const navigate = useNavigate();

  // Kiểm tra cả /airdrop và / (root) để đảm bảo toggle hiển thị đúng
  const isAirdrop = location.pathname.startsWith('/airdrop') || location.pathname === '/';
  
  console.log('RouteToggle: Current path:', location.pathname, 'isAirdrop:', isAirdrop);

  const handleAirdropClick = (e) => {
    e.preventDefault();
    console.log('RouteToggle: Airdrop clicked, current isAirdrop:', isAirdrop);
    if (!isAirdrop) {
      navigate('/airdrop');
    }
  };

  const handleTgeClick = (e) => {
    e.preventDefault();
    console.log('RouteToggle: TGE clicked, current isAirdrop:', isAirdrop);
    if (isAirdrop) {
      navigate('/tge');
    }
  };

  return (
    <div className="route-flip-switch-container">
      <div className="route-flip-switch" role="button" aria-label="Route toggle">
        <input type="radio" id="route-opt-1" name="route-switch" checked={isAirdrop} readOnly />
        <input type="radio" id="route-opt-2" name="route-switch" checked={!isAirdrop} readOnly />

        <label htmlFor="route-opt-1" className="switch-button" onClick={handleAirdropClick}>Airdrop</label>
        <label htmlFor="route-opt-2" className="switch-button" onClick={handleTgeClick}>TGE</label>

        <div className="switch-card">
          <div className="card-face card-front"></div>
          <div className="card-face card-back"></div>
        </div>
      </div>
    </div>
  );
}


