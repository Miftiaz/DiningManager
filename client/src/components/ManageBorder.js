import React, { useState } from 'react';
import { borderAPI } from '../utils/api';
import CalendarGrid from './CalendarGrid';
import '../styles/ManageBorder.css';

export default function ManageBorder() {
  const [searchId, setSearchId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [monthData, setMonthData] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [refundedAmount, setRefundedAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState(null); // null, 'adjust', or 'return'
  const [studentSelectedDays, setStudentSelectedDays] = useState(new Set()); // Original selected days
  const [studentReturnedDayIds, setStudentReturnedDayIds] = useState(new Set()); // Returned day IDs
  const [feastLoading, setFeastLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setError('Please enter student ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await borderAPI.searchStudent(searchId);
      setMonthData(res.data);
      if (res.data.exists) {
        setStudentData(res.data.student);
        // Pre-select student's existing days
        const existingDates = new Set(
          res.data.studentData?.selectedDays?.map(d => {
            const dDate = new Date(d.day.date);
            return dDate.toISOString().split('T')[0];
          }) || []
        );
        setStudentSelectedDays(existingDates);
        
        // Get returned day IDs
        const returnedDayIds = new Set(
          res.data.studentData?.returnedDays?.map(d => d.toString()) || []
        );
        setStudentReturnedDayIds(returnedDayIds);
        
        setSelectedDates(new Set()); // For adjust mode
      } else {
        setStudentData(null);
        setSelectedDates(new Set());
        setStudentSelectedDays(new Set());
        setStudentReturnedDayIds(new Set());
      }
      setSearched(true);
    } catch (err) {
      setError('Failed to search student');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (dateStr, isShiftKey) => {
    if (mode === 'adjust') {
      // In adjust mode, cannot select already purchased days or returned days
      if (studentSelectedDays.has(dateStr)) {
        return; // Can't select days that are already purchased
      }

      // Check if day is in returnedDays
      const calendarDaysMap = new Map(
        monthData.calendarDays.map(day => [
          new Date(day.date).toISOString().split('T')[0],
          day
        ])
      );
      const dayObj = calendarDaysMap.get(dateStr);
      if (dayObj && studentReturnedDayIds.has(dayObj._id.toString())) {
        return; // Can't select returned days
      }
    } else if (mode === 'return') {
      // In return mode, can only select previously selected (purchased) days
      if (!studentSelectedDays.has(dateStr)) {
        return; // Can't select days that weren't selected before
      }

      // Check if return limit has been reached
      const returnCount = studentData?.returnCount || 0;
      const maxReturns = 10;
      const remainingReturns = maxReturns - returnCount;
      const minReturnDays = 3;

      if (remainingReturns < minReturnDays) {
        return; // Can't return if less than 3 days quota remaining
      }

      // Check if adding this day would exceed limit
      if (!selectedDates.has(dateStr) && selectedDates.size >= remainingReturns) {
        return; // Can't select more days than allowed
      }
    }

    setSelectedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  };

  const handleAdjust = async () => {
    if (selectedDates.size === 0) {
      alert('Please select at least one day');
      return;
    }

    // Get and validate student details
    const name = (document.getElementById('studentName')?.value || studentData?.name || '').trim();
    const phone = (document.getElementById('studentPhone')?.value || studentData?.phone || '').trim();
    const roomNo = (document.getElementById('studentRoom')?.value || studentData?.roomNo || '').trim();

    // Validate required fields for new students
    if (!studentData) {
      if (!name) {
        setError('Student name is required');
        return;
      }
      if (!phone) {
        setError('Phone number is required');
        return;
      }
      if (!roomNo) {
        setError('Room number is required');
        return;
      }
    }

    setError('');

    try {
      // Convert selected dates back to day objects
      const calendarDaysMap = new Map(
        monthData.calendarDays.map(day => [
          new Date(day.date).toISOString().split('T')[0],
          day
        ])
      );

      const selectedDaysArray = Array.from(selectedDates).map(dateStr => {
        const day = calendarDaysMap.get(dateStr);
        return { dayId: day?._id, meals: 2 };
      }).filter(d => d.dayId);

      await borderAPI.adjustStudentDays({
        studentId: searchId,
        name: name,
        phone: phone,
        roomNo: roomNo,
        selectedDays: selectedDaysArray,
        paidAmount: Number(paidAmount),
        feastDue: 0
      });
      alert('Student updated successfully');
      
      // Refresh student data without clearing the form
      const res = await borderAPI.searchStudent(searchId);
      setMonthData(res.data);
      if (res.data.exists) {
        setStudentData(res.data.student);
        const existingDates = new Set(
          res.data.studentData?.selectedDays?.map(d => {
            const dDate = new Date(d.day.date);
            return dDate.toISOString().split('T')[0];
          }) || []
        );
        setStudentSelectedDays(existingDates);
        
        // Get returned day IDs
        const returnedDayIds = new Set(
          res.data.studentData?.returnedDays?.map(d => d.toString()) || []
        );
        setStudentReturnedDayIds(returnedDayIds);
        
        setSelectedDates(new Set());
      }
    } catch (err) {
      console.log(err);
      setError('Failed to update student');
    }
  };

  const handleReturnToken = async () => {
    // Get dates to be removed (dates selected in return mode)
    const datesToRemove = Array.from(selectedDates);

    if (datesToRemove.length === 0) {
      alert('Please select at least one day to return');
      return;
    }

    try {
      await borderAPI.returnToken({
        studentId: searchId,
        datesToRemove: datesToRemove,
        refundedAmount: Number(refundedAmount) || 0
      });
      alert('Token returned successfully');
      
      // Refresh student data without clearing the form
      const res = await borderAPI.searchStudent(searchId);
      setMonthData(res.data);
      if (res.data.exists) {
        setStudentData(res.data.student);
        const existingDates = new Set(
          res.data.studentData?.selectedDays?.map(d => {
            const dDate = new Date(d.day.date);
            return dDate.toISOString().split('T')[0];
          }) || []
        );
        setStudentSelectedDays(existingDates);
        
        // Get returned day IDs
        const returnedDayIds = new Set(
          res.data.studentData?.returnedDays?.map(d => d.toString()) || []
        );
        setStudentReturnedDayIds(returnedDayIds);
        
        setSelectedDates(new Set());
        setRefundedAmount(0);
      }
      setMode(null);
    } catch (err) {
      setError('Failed to return token');
    }
  };

  const handlePayFeast = async () => {
    setFeastLoading(true);
    try {
      await borderAPI.payFeastDue({ studentId: searchId });
      alert('Feast paid successfully');
      
      // Refresh student data
      const res = await borderAPI.searchStudent(searchId);
      setMonthData(res.data);
      if (res.data.exists) {
        setStudentData(res.data.student);
      }
    } catch (err) {
      setError('Failed to pay feast');
    } finally {
      setFeastLoading(false);
    }
  };

  return (
    <div className="manage-border-container">
      <h1>Manage Border</h1>

      <div className="search-section">
        <input
          type="text"
          placeholder="Enter Student ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {searched && !studentData && (
        <div className="new-student-form">
          <h2>Add New Student</h2>
          <div className="form-group">
            <input
              type="text"
              id="studentName"
              placeholder="Student Name"
              defaultValue={studentData?.name}
            />
            <input
              type="tel"
              id="studentPhone"
              placeholder="Phone"
              defaultValue={studentData?.phone}
            />
            <input
              type="text"
              id="studentRoom"
              placeholder="Room No"
              defaultValue={studentData?.roomNo}
            />
          </div>
        </div>
      )}

      {studentData && (
        <>
          <div className="student-info">
            <h2>Student Information</h2>
            <div className="info-grid">
              <p><strong>ID:</strong> {studentData.id}</p>
              <p><strong>Name:</strong> {studentData.name}</p>
              <p><strong>Phone:</strong> {studentData.phone}</p>
              <p><strong>Room:</strong> {studentData.roomNo}</p>
              <p><strong>Selected Days:</strong> {studentData.selectedDaysCount}</p>
            </div>
          </div>

          {!studentData.feastpaid ? (
            <div className="feast-box">
              <div className="feast-content">
                <div className="feast-icon">🍽️</div>
                <div className="feast-info">
                  <h3>Feast Due</h3>
                  <p className="feast-amount">100 TK</p>
                </div>
              </div>
              <button 
                className="feast-button"
                onClick={handlePayFeast}
                disabled={feastLoading}
              >
                {feastLoading ? 'Processing...' : 'Pay feast due'}
              </button>
            </div>
          ) : (
            <div className="feast-box feast-paid">
              <div className="feast-content">
                <div className="feast-icon">✓</div>
                <div className="feast-info">
                  <h3>Feast Payment</h3>
                  <p className="feast-status">Paid</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {searched && monthData?.calendarDays?.length > 0 && (
        <div className="calendar-selection">
          <div className="calendar-wrapper">
            <div className="calendar-section">
              <h2>{mode === 'adjust' ? 'Select Dining Days' : mode === 'return' ? 'Return Selected Days' : 'Please Choose an option to Buy or Return Tokens'}</h2>
              <CalendarGrid 
                monthData={monthData}
                selectedDates={selectedDates}
                onDateClick={handleDateClick}
                mode={mode ? (mode === 'return' ? 'return-token' : 'add-break') : null}
                purchasedDates={studentSelectedDays}
                returnedDayIds={studentReturnedDayIds}
              />
            </div>

            <div className="actions-section">
              {searched && monthData?.calendarDays?.length > 0 && (
                <div className="mode-buttons">
                  <button 
                    className={`adjust-btn ${mode === 'adjust' ? 'active' : ''}`} 
                    onClick={() => {
                      if (mode === 'adjust') {
                        setMode(null);
                        setSelectedDates(new Set());
                        setRefundedAmount(0);
                      } else {
                        setMode('adjust');
                        setSelectedDates(new Set());
                        setRefundedAmount(0);
                      }
                    }}
                  >
                    Adjust Days
                  </button>
                  <button 
                    className={`return-btn ${mode === 'return' ? 'active' : ''}`} 
                    onClick={() => {
                      if (mode === 'return') {
                        setMode(null);
                        setSelectedDates(new Set());
                        setRefundedAmount(0);
                      } else {
                        setMode('return');
                        setSelectedDates(new Set());
                        setRefundedAmount(0);
                      }
                    }}
                  >
                    Return Token
                  </button>
                </div>
              )}

              {mode === 'adjust' && selectedDates.size > 2 && (
                <div className="payment-section">
                  <h3>Payment Details</h3>
                  <p>Payable Amount: {selectedDates.size * 2 * 40} TK (2 meals × 40 TK)</p>
                  <input
                    type="number"
                    placeholder="Paid Amount"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                  <p>Due Amount: {selectedDates.size * 2 * 40 - Number(paidAmount)} TK</p>

                  <button onClick={() => {handleAdjust();}}  className="submit-btn">
                    Save Changes
                  </button>
                </div>
              )}

              {mode === 'return' && (
                <div className="return-section">
                  {(() => {
                    const returnCount = studentData?.returnCount || 0;
                    const maxReturns = 10;
                    const minReturnDays = 3;
                    const remainingReturns = maxReturns - returnCount;
                    
                    if (remainingReturns < minReturnDays) {
                      return (
                        <p className="return-limit-reached" style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                          ❌ Insufficient quota. Need minimum {minReturnDays} days to return. Only {remainingReturns} day{remainingReturns !== 1 ? 's' : ''} remaining.
                        </p>
                      );
                    }

                    return (
                      <>
                        <p className="return-limit-notice" style={{ color: '#f57c00', fontWeight: 'bold' }}>
                          ℹ️ You can return up to {remainingReturns} day{remainingReturns !== 1 ? 's' : ''} (minimum {minReturnDays} days required)
                        </p>
                        <p className="return-info">Select days to return (click days above)</p>
                        {selectedDates.size > 0 && (
                          <>
                            <p className="return-days">Days selected: {selectedDates.size}</p>
                            {selectedDates.size < minReturnDays && (
                              <p className="return-min-warning" style={{ color: '#f57c00' }}>
                                ⚠️ Select at least {minReturnDays - selectedDates.size} more day{minReturnDays - selectedDates.size !== 1 ? 's' : ''}
                              </p>
                            )}
                            <p className="refund-amount">Refundable Amount: {selectedDates.size * 35} TK</p>
                            <input
                              type="number"
                              placeholder="Refunded Amount"
                              value={refundedAmount}
                              onChange={(e) => setRefundedAmount(e.target.value)}
                            />
                            <button 
                              onClick={handleReturnToken} 
                              className="submit-btn return-btn"
                              disabled={selectedDates.size < minReturnDays}
                            >
                              {selectedDates.size < minReturnDays ? `Select ${minReturnDays - selectedDates.size} more day(s)` : 'Return Token'}
                            </button>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {studentData && studentData.transactions && studentData.transactions.length > 0 && (
        <div className="transaction-history">
          <h2>Transaction History</h2>
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
              {studentData.transactions.map((transaction, index) => (
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
                <td><strong>{studentData.transactions.reduce((sum, t) => sum + t.days, 0)}</strong></td>
                <td><strong>{studentData.transactions.reduce((sum, t) => sum + t.amount, 0)}</strong></td>
                <td><strong>{studentData.transactions.reduce((sum, t) => sum + t.paidAmount, 0)}</strong></td>
                <td><strong>{studentData.transactions.reduce((sum, t) => sum + (t.amount - t.paidAmount), 0)}</strong></td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
