import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CitizenPortal from './pages/CitizenPortal';
import AdminPortal from './pages/AdminPortal';
import FieldPortal from './pages/FieldPortal';
import LoginPortal from './pages/LoginPortal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CitizenPortal />} />
        <Route path="/citizen" element={<CitizenPortal />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/field" element={<FieldPortal />} />
        <Route path="/login" element={<LoginPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
