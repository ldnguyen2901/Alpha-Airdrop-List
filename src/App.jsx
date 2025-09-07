import React from 'react';
import { ThemeProvider, AutoRefreshProvider } from './contexts';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PersistLayout } from './components';
import Airdrop from './pages/Airdrop';
import Tge from './pages/Tge';

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
      <AutoRefreshProvider>
        <Routes>
          <Route path="/" element={<PersistLayout />}>
            <Route index element={<Navigate to="/airdrop" replace />} />
            <Route path="airdrop" element={<Airdrop />} />
            <Route path="tge" element={<Tge />} />
            <Route path="*" element={<Navigate to="/airdrop" replace />} />
          </Route>
        </Routes>
      </AutoRefreshProvider>
    </ThemeProvider>
  );
}
