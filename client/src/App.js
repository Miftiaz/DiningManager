import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/helpers';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ManageBorder from './components/ManageBorder';
import ManageFeastToken from './components/ManageFeastToken';
import AdjustDiningMonth from './components/AdjustDiningMonth';
import './styles/App.css';

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-border"
          element={
            <ProtectedRoute>
              <ManageBorder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-feast-token"
          element={
            <ProtectedRoute>
              <ManageFeastToken />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adjust-dining-month"
          element={
            <ProtectedRoute>
              <AdjustDiningMonth />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}
