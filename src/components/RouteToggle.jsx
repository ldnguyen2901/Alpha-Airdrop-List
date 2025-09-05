import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './RouteToggle.css';

export default function RouteToggle() {
  const location = useLocation();
  const navigate = useNavigate();

  const isAirdrop = location.pathname.startsWith('/airdrop');

  const handleAirdropClick = (e) => {
    e.preventDefault();
    if (!isAirdrop) {
      navigate('/airdrop');
    }
  };

  const handleTgeClick = (e) => {
    e.preventDefault();
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


