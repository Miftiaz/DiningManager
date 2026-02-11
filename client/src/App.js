import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/helpers';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ManageBorder from './components/ManageBorder';
import ManageFeastToken from './components/ManageFeastToken';
import AdjustDiningMonth from './components/AdjustDiningMonth';
import Transactions from './components/Transactions';
import Sidebar from './components/Sidebar';
import './styles/App.css';

function ProtectedRoute({ children, isExpanded, onToggleSidebar }) {
  return isAuthenticated() ? (
    <div className="app-layout">
      <Sidebar isExpanded={isExpanded} onToggleSidebar={onToggleSidebar} />
      <div className="main-content">
        {children}
      </div>
    </div>
  ) : (
    <Navigate to="/login" />
  );
}

export default function App() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isExpanded={isSidebarExpanded} onToggleSidebar={(val) => setIsSidebarExpanded(val)}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-border"
          element={
            <ProtectedRoute isExpanded={isSidebarExpanded} onToggleSidebar={(val) => setIsSidebarExpanded(val)}>
              <ManageBorder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-feast-token"
          element={
            <ProtectedRoute isExpanded={isSidebarExpanded} onToggleSidebar={(val) => setIsSidebarExpanded(val)}>
              <ManageFeastToken />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adjust-dining-month"
          element={
            <ProtectedRoute isExpanded={isSidebarExpanded} onToggleSidebar={(val) => setIsSidebarExpanded(val)}>
              <AdjustDiningMonth />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute isExpanded={isSidebarExpanded} onToggleSidebar={(val) => setIsSidebarExpanded(val)}>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}
