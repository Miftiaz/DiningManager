import React, { useState } from 'react';
import { borderAPI } from '../utils/api';
import { formatDate, getDayName } from '../utils/helpers';
import CalendarGrid from './CalendarGrid';
import '../styles/ManageBorder.css';

export default function ManageBorder() {
  const [searchId, setSearchId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [monthData, setMonthData] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState(null); // null, 'adjust', or 'return'
  const [studentSelectedDays, setStudentSelectedDays] = useState(new Set()); // Original selected days

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
        setSelectedDates(new Set()); // For adjust mode
        setPaidAmount(res.data.student.paidAmount || 0);
      } else {
        setStudentData(null);
        setSelectedDates(new Set());
        setStudentSelectedDays(new Set());
        setPaidAmount(0);
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
      // In adjust mode, cannot select already purchased days
      if (studentSelectedDays.has(dateStr)) {
        return; // Can't select days that are already purchased
      }
    } else if (mode === 'return') {
      // In return mode, can only select previously selected (purchased) days
      if (!studentSelectedDays.has(dateStr)) {
        return; // Can't select days that weren't selected before
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
        name: document.getElementById('studentName')?.value || studentData?.name,
        phone: document.getElementById('studentPhone')?.value || studentData?.phone,
        roomNo: document.getElementById('studentRoom')?.value || studentData?.roomNo,
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
        setSelectedDates(new Set());
        setPaidAmount(res.data.student.paidAmount || 0);
      }
    } catch (err) {
      console.log(err);
      setError('Failed to update student');
    }
  };

  const handleReturnToken = async () => {
    // Get dates to be removed (dates in studentSelectedDays but not in selectedDates)
    const datesToRemove = Array.from(studentSelectedDays).filter(d => !selectedDates.has(d));

    if (datesToRemove.length === 0) {
      alert('Please select at least one day to return');
      return;
    }

    try {
      await borderAPI.returnToken({
        studentId: searchId,
        datesToRemove: datesToRemove
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
        setSelectedDates(new Set());
        setPaidAmount(res.data.student.paidAmount || 0);
      }
      setMode(null);
    } catch (err) {
      setError('Failed to return token');
    }
  };

  return (
    <div className="manage-border-container">
      <div className="back-button">
        <button onClick={() => window.history.back()}>← Back</button>
      </div>

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
        <div className="student-info">
          <h2>Student Information</h2>
          <div className="info-grid">
            <p><strong>ID:</strong> {studentData.id}</p>
            <p><strong>Name:</strong> {studentData.name}</p>
            <p><strong>Phone:</strong> {studentData.phone}</p>
            <p><strong>Room:</strong> {studentData.roomNo}</p>
            <p><strong>Selected Days:</strong> {studentData.selectedDaysCount}</p>
            <p><strong>Payable:</strong> {studentData.payableAmount} TK</p>
            <p><strong>Paid:</strong> {studentData.paidAmount} TK</p>
            <p><strong>Due:</strong> {studentData.dueAmount} TK</p>
          </div>
        </div>
      )}

      {searched && monthData?.calendarDays?.length > 0 && (
        <div className="calendar-selection">
          <div className="calendar-wrapper">
            <div className="calendar-section">
              <h2>{mode === 'adjust' ? 'Select Dining Days' : 'Return Selected Days'}</h2>
              <CalendarGrid 
                monthData={monthData}
                selectedDates={selectedDates}
                onDateClick={handleDateClick}
                mode={mode ? (mode === 'return' ? 'return-token' : 'add-break') : null}
                purchasedDates={studentSelectedDays}
              />
            </div>

            <div className="actions-section">
              {searched && monthData?.calendarDays?.length > 0 && (
                <div className="mode-buttons">
                  <button 
                    className={mode === 'adjust' ? 'active' : ''} 
                    onClick={() => {
                      if (mode === 'adjust') {
                        setMode(null);
                        setSelectedDates(new Set());
                      } else {
                        setMode('adjust');
                        setSelectedDates(new Set());
                      }
                    }}
                  >
                    Adjust Days
                  </button>
                  <button 
                    className={mode === 'return' ? 'active' : ''} 
                    onClick={() => {
                      if (mode === 'return') {
                        setMode(null);
                        setSelectedDates(new Set());
                      } else {
                        setMode('return');
                        setSelectedDates(new Set());
                      }
                    }}
                  >
                    Return Token
                  </button>
                </div>
              )}

              {mode === 'adjust' && selectedDates.size > 0 && (
                <div className="payment-section">
                  <h3>Payment Details</h3>
                  <p>Payable Amount: {selectedDates.size * 2 * 40} TK (2 meals × 40 TK)</p>
                  <input
                    type="number"
                    placeholder="Paid Amount"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                  <p>Due Amount: {Math.max(0, selectedDates.size * 2 * 40 - Number(paidAmount))} TK</p>

                  <button onClick={() => {handleAdjust();}}  className="submit-btn">
                    Save Changes
                  </button>
                </div>
              )}

              {mode === 'return' && Array.from(studentSelectedDays).filter(d => !selectedDates.has(d)).length > 0 && (
                <div className="return-section">
                  <p className="return-info">Select days to return (uncheck selected days above)</p>
                  <p className="return-days">Days to return: {Array.from(studentSelectedDays).filter(d => !selectedDates.has(d)).length}</p>
                  <p className="refund-amount">Refundable Amount: {Array.from(studentSelectedDays).filter(d => !selectedDates.has(d)).length * 35} TK</p>
                  <button onClick={handleReturnToken} className="submit-btn return-btn">
                    Return Token
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
