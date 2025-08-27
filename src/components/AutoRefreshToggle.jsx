import { useState, useEffect } from 'react';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PauseIcon from '@mui/icons-material/Pause';

export default function AutoRefreshToggle({ timerRef, onToggle, isEnabled }) {
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(() => {
    const saved = localStorage.getItem('autoRefreshEnabled');
    return saved === null ? true : saved === 'true'; // Default to enabled
  });

  // Sync with parent state
  useEffect(() => {
    if (isEnabled !== undefined) {
      setIsAutoRefreshEnabled(isEnabled);
    }
  }, [isEnabled]);

  useEffect(() => {
    localStorage.setItem('autoRefreshEnabled', isAutoRefreshEnabled);
  }, [isAutoRefreshEnabled]);

  const toggleAutoRefresh = () => {
    const newState = !isAutoRefreshEnabled;
    setIsAutoRefreshEnabled(newState);
    
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <button
      onClick={toggleAutoRefresh}
      className={`auto-refresh-toggle px-3 py-2 rounded-2xl shadow-sm text-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md flex items-center gap-2 ${
        isAutoRefreshEnabled
          ? 'bg-green-500 hover:bg-green-600 text-white'
          : 'bg-gray-500 hover:bg-gray-600 text-white'
      }`}
      title={`Auto refresh is ${isAutoRefreshEnabled ? 'enabled' : 'disabled'}. Click to ${isAutoRefreshEnabled ? 'disable' : 'enable'}.`}
    >
      {isAutoRefreshEnabled ? (
        <AutorenewIcon 
          sx={{ 
            fontSize: 16,
            animation: 'spin 2s linear infinite'
          }}
          className="refresh-spin"
        />
      ) : (
        <PauseIcon sx={{ fontSize: 16 }} />
      )}
      <span className="hidden sm:inline">
        {isAutoRefreshEnabled ? 'Auto' : 'Paused'}
      </span>
    </button>
  );
}
