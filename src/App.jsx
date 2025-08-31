import React from 'react';
import { ThemeProvider, NotificationProvider } from './contexts';
import { AppContent } from './components';
import 'react-toastify/dist/ReactToastify.css';

/**
 * React Airdrop Alpha Tracker
 * - Dữ liệu các cột khớp Google Sheet: A..H
 * - Tự động fetch giá từ CoinGecko qua Api Id (cột D)
 * - G = Token Price (từ API) | H = B x G
 * - Hỗ trợ thêm dòng nhanh, dán dữ liệu từ Sheet (CSV/TSV), export CSV
 * - Tùy chỉnh chu kỳ làm mới
 */

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  );
}
