import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { formatDate } from '../utils/helpers';
import CalendarGrid from './CalendarGrid';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [showMonthSetup, setShowMonthSetup] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchDashboard();
  }, [location]);

  const fetchDashboard = async () => {
    try {
      const res = await authAPI.getDashboard();
      console.log(res.data);
      setDashboardData(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard');
      setLoading(false);
    }
  };

  const handleStartMonth = async () => {
    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    try {
      await authAPI.startDiningMonth({ startDate });
      setShowMonthSetup(false);
      setStartDate('');
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start month');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Manager Dashboard</h1>
        <button onClick={() => {
          localStorage.clear();
          navigate('/login');
        }}>Logout</button>
      </div>

      {error && <div className="error">{error}</div>}

      {dashboardData?.activeDiningMonth ? (
        <>
          <div className="next-day-info">
            <h2>Next Day Border Count</h2>
            <div className="info-card">
              <p>Day: {dashboardData.nextDayInfo?.dayNumber}</p>
              <p>Date: {formatDate(dashboardData.nextDayInfo?.date)}</p>
              <p>Borders: {dashboardData.nextDayInfo?.borderCount}</p>
            </div>
          </div>

          <div className="calendar-section">
            <h2>Dining Month Calendar</h2>
            <CalendarGrid 
              monthData={dashboardData}
            />
          </div>

          <div className="action-buttons">
            <button onClick={() => navigate('/manage-border')}>Manage Border</button>
            <button onClick={() => navigate('/manage-feast-token')}>Manage Feast Token</button>
            <button onClick={() => navigate('/adjust-dining-month')}>Adjust Dining Month</button>
          </div>
        </>
      ) : (
        <div className="no-month">
          <h2>No Active Dining Month</h2>
          <button onClick={() => setShowMonthSetup(true)}>Start Dining Month</button>
        </div>
      )}

      {showMonthSetup && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Start New Dining Month</h2>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleStartMonth}>Start</button>
              <button onClick={() => {
                setShowMonthSetup(false);
                setStartDate('');
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
