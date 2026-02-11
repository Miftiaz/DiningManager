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
  const [clearPaymentLoading, setClearPaymentLoading] = useState(false);

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

  const handleClearPaymentDue = async () => {
    setClearPaymentLoading(true);
    try {
      await borderAPI.clearPaymentDue({ studentId: selectedStudent.id });
      alert('Payment due cleared successfully');
      
      // Refresh students list
      const res = await borderAPI.getAllStudents();
      setStudents(res.data.students);
      
      // Update selected student
      const updatedStudent = res.data.students.find(s => s.id === selectedStudent.id);
      setSelectedStudent(updatedStudent);
    } catch (err) {
      setError('Failed to clear payment due');
      console.error(err);
    } finally {
      setClearPaymentLoading(false);
    }
  };

  const calculateDailyFeastQuota = () => {
    if (!selectedStudent) return 0;
    const selectedDaysCount = selectedStudent.selectedDaysCount || 0;
    const returnedDaysCount = selectedStudent.returnedDaysCount || 0;
    const totalDaysUsed = selectedDaysCount + returnedDaysCount;
    const remainingDays = 30 - totalDaysUsed;
    return remainingDays > 0 ? remainingDays * 10 : 0;
  };

  const handlePayDailyFeastQuota = async () => {
    setFeastLoading(true);
    try {
      await borderAPI.payDailyFeastQuota({ studentId: selectedStudent.id });
      alert('Daily feast quota payment processed successfully');
      
      // Refresh students list
      const res = await borderAPI.getAllStudents();
      setStudents(res.data.students);
      
      // Update selected student
      const updatedStudent = res.data.students.find(s => s.id === selectedStudent.id);
      setSelectedStudent(updatedStudent);
    } catch (err) {
      setError('Failed to process daily feast quota payment');
      console.error(err);
    } finally {
      setFeastLoading(false);
    }
  };

  const handleClearAll = async () => {
    setFeastLoading(true);
    try {
      // Call all three payment functions
      if (!selectedStudent.feastpaid) {
        await borderAPI.payFeastDue({ studentId: selectedStudent.id });
      }
      
      if (!selectedStudent.dailyFeastQuotaPaid) {
        await borderAPI.payDailyFeastQuota({ studentId: selectedStudent.id });
      }
      
      if (selectedStudent.dueAmount !== 0) {
        await borderAPI.clearPaymentDue({ studentId: selectedStudent.id });
      }
      
      alert('All payments processed successfully');
      
      // Refresh students list
      const res = await borderAPI.getAllStudents();
      setStudents(res.data.students);
      
      // Update selected student
      const updatedStudent = res.data.students.find(s => s.id === selectedStudent.id);
      setSelectedStudent(updatedStudent);
    } catch (err) {
      setError('Failed to process clear all payments');
      console.error(err);
    } finally {
      setFeastLoading(false);
    }
  };

  return (
    <div className="manage-feast-token-container">
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
                      <span className="label">Days:</span>
                      <span>{(student.selectedDaysCount)}</span>
                    </div>

                    <div className="card-row">
                      <span className="label">Payment:</span>
                      <span style={{ color: 'white', backgroundColor: student.dueAmount === 0 && student.totalAmount > 0 ? 'green' : 'red', padding: '4px 8px', borderRadius: '4px' }}>
                        {student.dueAmount === 0 && student.totalAmount > 0 ? 'Paid' : 'Due'}
                      </span>
                    </div>

                    <div className="card-row">
                      <span className="label">Feast:</span>
                      <span style={{ color: 'white', backgroundColor: student.feastpaid ? 'green' : 'red', padding: '4px 8px', borderRadius: '4px' }}>
                        {student.feastpaid ? 'Paid' : 'Feast due 100'}
                      </span>
                    </div>

                    <div className="card-row">
                      <span className="label">Feast Daily Quota:</span>
                      <span style={{ color: 'white', backgroundColor: student.dailyFeastQuotaPaid ? 'green' : 'red', padding: '4px 8px', borderRadius: '4px' }}>
                        {student.dailyFeastQuotaPaid ? 'Paid' : 'Due'}
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

              {selectedStudent.feastpaid && selectedStudent.dailyFeastQuotaPaid && selectedStudent.dueAmount === 0 ? (
                <div className="all-clear-message">
                  <h3>All dues clear. Enjoy the feast!</h3>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {selectedStudent.dueAmount !== 0 && (
                      <div className="payment-due-box">
                        <p>
                          <strong className={selectedStudent.dueAmount < 0 ? 'refund-text' : 'due-text'}>
                            {selectedStudent.dueAmount < 0 ? 'Refund Due: ' : 'Payment Due: '}
                            {Math.abs(selectedStudent.dueAmount)} TK
                          </strong>
                        </p>
                        <button 
                          onClick={handleClearPaymentDue}
                          disabled={clearPaymentLoading}
                        >
                          {clearPaymentLoading ? 'Processing...' : selectedStudent.dueAmount < 0 ? 'Clear Refund Due' : 'Clear Payment Due'}
                        </button>
                      </div>
                    )}

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

                    {!selectedStudent.dailyFeastQuotaPaid && (
                      <div className="daily-feast-quota-box">
                        <p>
                          <strong>Daily Feast Quota Due: {calculateDailyFeastQuota()} TK</strong>
                        </p>
                        <p className="quota-description">
                          Days used: {(selectedStudent.selectedDaysCount || 0) + (selectedStudent.returnedDaysCount || 0)}/30 | 
                          Remaining days: {30 - ((selectedStudent.selectedDaysCount || 0) + (selectedStudent.returnedDaysCount || 0))}
                        </p>
                        <button 
                          onClick={handlePayDailyFeastQuota}
                          disabled={feastLoading}
                        >
                          {feastLoading ? 'Processing...' : 'Pay Daily Feast Quota'}
                        </button>
                      </div>
                    )}
                  </div>

                  {(!selectedStudent.feastpaid || !selectedStudent.dailyFeastQuotaPaid || selectedStudent.dueAmount !== 0) && (
                    <button 
                      className="clear-all-btn"
                      onClick={handleClearAll}
                      disabled={feastLoading}
                    >
                      {feastLoading ? 'Processing...' : 'Clear All'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
