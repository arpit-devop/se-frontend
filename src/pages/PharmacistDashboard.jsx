import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, FileText, AlertCircle, LogOut, BarChart3, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getUser, clearAuth } from '../utils/auth';
import InventoryManagement from '../components/pharmacist/InventoryManagement';
import PrescriptionManagement from '../components/pharmacist/PrescriptionManagement';
import ExpiryAlerts from '../components/pharmacist/ExpiryAlerts';
import Dashboard from '../components/pharmacist/Dashboard';

const PharmacistDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', path: '/pharmacist', icon: BarChart3 },
    { name: 'Inventory', path: '/pharmacist/inventory', icon: Package },
    { name: 'Prescriptions', path: '/pharmacist/prescriptions', icon: Upload },
    { name: 'Expiry Alerts', path: '/pharmacist/alerts', icon: AlertCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-blue-900">PharmaVentory</h1>
                <p className="text-xs text-gray-500">Pharmacist Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-red-600"
                data-testid="logout-button"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/prescriptions" element={<PrescriptionManagement />} />
          <Route path="/alerts" element={<ExpiryAlerts />} />
        </Routes>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
