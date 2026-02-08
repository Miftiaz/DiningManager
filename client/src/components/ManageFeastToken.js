import React, { useState, useEffect } from 'react';
import { borderAPI } from '../utils/api';
import '../styles/ManageFeastToken.css';

export default function ManageFeastToken() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feastLoading, setFeastLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await borderAPI.getAllStudents();
      setStudents(res.data.students);
    } catch (err) {
      setError('Failed to load students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentStatus = (dueAmount, totalAmount) => {
    if (totalAmount === 0) return 'No Booking';
    if (dueAmount === 0) return 'Paid';
    if (dueAmount < 0) return 'Advance';
    return 'Pending';
  };

  const handlePayFeast = async () => {
    setFeastLoading(true);
    try {
      await borderAPI.payFeastDue({ studentId: selectedStudent.id });
      alert('Feast paid successfully');
      
      // Refresh students list
      const res = await borderAPI.getAllStudents();
      setStudents(res.data.students);
      
      // Update selected student
      const updatedStudent = res.data.students.find(s => s.id === selectedStudent.id);
      setSelectedStudent(updatedStudent);
    } catch (err) {
      setError('Failed to pay feast');
      console.error(err);
    } finally {
      setFeastLoading(false);
    }
  };

  return (
    <div className="manage-feast-token-container">
      <div className="back-button">
        <button onClick={() => window.history.back()}>← Back</button>
      </div>

      <h1>Manage Students</h1>

      {error && <div className="error">{error}</div>}

      <div className="search-section">
        <input
          type="text"
          placeholder="Search by name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading students...</div>
      ) : (
        <>
          <div className="students-cards">
            {filteredStudents.length === 0 ? (
              <p>No students found for this month</p>
            ) : (
              filteredStudents.map((student) => (
                <div key={student._id} className="student-card">
                  <div className="card-header">
                    <h3>{student.name}</h3>
                    <span className="student-id">{student.id}</span>
                  </div>
                  
                  <div className="card-content">
                    <div className="card-row">
                      <span className="label">Payment:</span>
                      <span className={`status ${getPaymentStatus(student.dueAmount, student.totalAmount).toLowerCase().replace(' ', '-')}`}>
                        {getPaymentStatus(student.dueAmount, student.totalAmount)}
                      </span>
                    </div>
                    
                    <div className="card-row">
                      <span className="label">Due/Refund:</span>
                      <span className={student.dueAmount < 0 ? 'refund' : 'due'}>
                        {Math.abs(student.dueAmount)} TK
                      </span>
                    </div>
                    
                    <div className="card-row">
                      <span className="label">Days:</span>
                      <span>{(student.selectedDaysCount)}</span>
                    </div>

                    <div className="card-row">
                      <span className="label">Feast:</span>
                      <span style={{ color: student.feastpaid ? 'green' : 'orange' }}>
                        {student.feastpaid ? 'Paid' : 'Feast due 100'}
                      </span>
                    </div>
                  </div>

                  <button 
                    className="details-btn"
                    onClick={() => setSelectedStudent(student)}
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedStudent.name}</h2>
              <button className="close-btn" onClick={() => setSelectedStudent(null)}>×</button>
            </div>

            <div className="modal-content">
              <div className="student-details">
                <h3>Student Information</h3>
                <div className="info-grid">
                  <p><strong>ID:</strong> {selectedStudent.id}</p>
                  <p><strong>Phone:</strong> {selectedStudent.phone}</p>
                  <p><strong>Room:</strong> {selectedStudent.roomNo}</p>
                  <p><strong>Selected Days:</strong> {selectedStudent.selectedDaysCount}</p>
                  <p>
                    <strong>Feast:</strong> 
                    {selectedStudent.feastpaid ? (
                      <span style={{ color: 'green', marginLeft: '10px' }}>Paid</span>
                    ) : (
                      <span style={{ color: 'orange', marginLeft: '10px' }}>Feast due 100</span>
                    )}
                  </p>
                </div>
              </div>

              {selectedStudent.transactions && selectedStudent.transactions.length > 0 && (
                <div className="transaction-history">
                  <h3>Transaction History</h3>
                  <table className="transaction-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Days</th>
                        <th>Payable/Returnable</th>
                        <th>Paid/Refunded</th>
                        <th>Payment Due / Refund Due</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.transactions.map((transaction, index) => (
                        <tr key={index}>
                          <td>{new Date(transaction.date).toLocaleDateString()}</td>
                          <td>{transaction.days}</td>
                          <td>{transaction.amount}</td>
                          <td>{transaction.paidAmount}</td>
                          <td>{transaction.amount - transaction.paidAmount}</td>
                          <td>{transaction.type}</td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td colSpan="1"><strong>Total</strong></td>
                        <td><strong>{selectedStudent.transactions.reduce((sum, t) => sum + t.days, 0)}</strong></td>
                        <td><strong>{selectedStudent.transactions.reduce((sum, t) => sum + t.amount, 0)}</strong></td>
                        <td><strong>{selectedStudent.transactions.reduce((sum, t) => sum + t.paidAmount, 0)}</strong></td>
                        <td><strong>{selectedStudent.transactions.reduce((sum, t) => sum + (t.amount - t.paidAmount), 0)}</strong></td>
                        <td>-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="summary">
                <h3>Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Total Amount:</span>
                    <span>{selectedStudent.totalAmount} TK</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Total Paid:</span>
                    <span>{selectedStudent.totalPaid} TK</span>
                  </div>
                  <div className="summary-item">
                    <span className={`label ${selectedStudent.dueAmount < 0 ? 'refund' : 'due'}`}>
                      {selectedStudent.dueAmount < 0 ? 'Refund Due:' : 'Payment Due:'}
                    </span>
                    <span className={selectedStudent.dueAmount < 0 ? 'refund' : 'due'}>
                      {Math.abs(selectedStudent.dueAmount)} TK
                    </span>
                  </div>
                </div>
              </div>

              {!selectedStudent.feastpaid && (
                <div className="feast-payment-box">
                  <p>
                    <strong>Feast due 100 TK</strong>
                  </p>
                  <button 
                    onClick={handlePayFeast}
                    disabled={feastLoading}
                  >
                    {feastLoading ? 'Processing...' : 'Pay feast due'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
