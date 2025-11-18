import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import ChatbotWidget from './components/ChatbotWidget';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacist/*"
            element={
              <ProtectedRoute allowedRoles={['pharmacist']}>
                <PharmacistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supplier/*"
            element={
              <ProtectedRoute allowedRoles={['supplier']}>
                <SupplierDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <ChatbotWidget />
        <Toaster position="top-right" />
                    </div>
    </BrowserRouter>
  );
}

export default App;
