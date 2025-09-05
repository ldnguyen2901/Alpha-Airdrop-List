import React from 'react';
import { ThemeProvider } from './contexts';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PersistLayout } from './components';

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
      <Routes>
        <Route element={<PersistLayout />}>
          <Route path="/" element={<Navigate to="/airdrop" replace />} />
          <Route path="/airdrop" element={<span />} />
          <Route path="/tge" element={<span />} />
          <Route path="*" element={<Navigate to="/airdrop" replace />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}
