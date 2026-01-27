import React, { useState, useEffect } from 'react';
import { feastTokenAPI } from '../utils/api';
import '../styles/ManageFeastToken.css';

export default function ManageFeastToken() {
  const [subscribers, setSubscribers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async (search = '') => {
    setLoading(true);
    try {
      const res = await feastTokenAPI.getList(search);
      setSubscribers(res.data.subscribersList);
    } catch (err) {
      setError('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    fetchSubscribers(e.target.value);
  };

  const filteredSubscribers = subscribers.filter(sub =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="manage-feast-token-container">
      <div className="back-button">
        <button onClick={() => window.history.back()}>← Back</button>
      </div>

      <h1>Manage Feast Token</h1>

      {error && <div className="error">{error}</div>}

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by name or ID"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {loading ? (
        <div className="loading">Loading subscribers...</div>
      ) : (
        <div className="subscribers-list">
          <h2>Feast Token Subscribers</h2>
          {filteredSubscribers.length === 0 ? (
            <p>No subscribers found</p>
          ) : (
            <table className="subscribers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Total Cost</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map((sub) => (
                  <tr key={sub.id}>
                    <td>{sub.name}</td>
                    <td>{sub.studentId}</td>
                    <td className={`status ${sub.paymentStatus.toLowerCase()}`}>
                      {sub.paymentStatus}
                    </td>
                    <td>{sub.totalCost} TK</td>
                    <td>{sub.paidAmount} TK</td>
                    <td>{sub.dueAmount} TK</td>
                    <td>
                      <button onClick={() => setSelectedToken(sub)}>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedToken && (
        <div className="modal-overlay" onClick={() => setSelectedToken(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Feast Token Details</h2>
            <p><strong>Student:</strong> {selectedToken.name} ({selectedToken.studentId})</p>
            <p><strong>Total Cost:</strong> {selectedToken.totalCost} TK</p>
            <p><strong>Paid Amount:</strong> {selectedToken.paidAmount} TK</p>
            <p><strong>Due Amount:</strong> {selectedToken.dueAmount} TK</p>
            <p><strong>Status:</strong> {selectedToken.paymentStatus}</p>
            <button onClick={() => setSelectedToken(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
