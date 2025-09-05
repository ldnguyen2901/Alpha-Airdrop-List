import React from 'react';
import { ThemeProvider, NotificationProvider } from './contexts';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PersistLayout } from './components';
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
        <Routes>
          <Route element={<PersistLayout />}>
            <Route path="/" element={<Navigate to="/airdrop" replace />} />
            <Route path="/airdrop" element={<span />} />
            <Route path="/tge" element={<span />} />
            <Route path="*" element={<Navigate to="/airdrop" replace />} />
          </Route>
        </Routes>
      </NotificationProvider>
    </ThemeProvider>
  );
}
