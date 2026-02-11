import React, { useState, useEffect } from 'react';
import { diningMonthAPI } from '../utils/api';
import CalendarGrid from './CalendarGrid';
import '../styles/AdjustDiningMonth.css';

export default function AdjustDiningMonth() {
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [mode, setMode] = useState(null); // null, 'add-break', or 'remove-break'
  const [lastClickedDate, setLastClickedDate] = useState(null);
  const [breakReason, setBreakReason] = useState('');

  useEffect(() => {
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await diningMonthAPI.getCalendar();
      setMonthData(res.data);
    } catch (err) {
      setError('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (dateStr, isShiftKey, isCurrentlyBreak) => {
    // Determine which dates to select based on mode and shift key
    if (mode === 'add-break' && isCurrentlyBreak) return; // Can't select break dates in add mode
    if (mode === 'remove-break' && !isCurrentlyBreak) return; // Can't select non-break dates in remove mode

    setSelectedDates(prev => {
      const newSet = new Set(prev);

      if (isShiftKey && lastClickedDate) {
        // Range selection
        // Find all dates between lastClickedDate and dateStr
        const allDates = monthData.calendarDays.map(d => {
          const date = new Date(d.date);
          return date.toISOString().split('T')[0];
        });
        const lastIdx = allDates.indexOf(lastClickedDate);
        const currentIdx = allDates.indexOf(dateStr);

        if (lastIdx !== -1 && currentIdx !== -1) {
          const start = Math.min(lastIdx, currentIdx);
          const end = Math.max(lastIdx, currentIdx);

          for (let i = start; i <= end; i++) {
            const date = allDates[i];
            // Check if this date is valid for current mode
            const isDiningDay = monthData.calendarDays.find(d => {
              const dDate = new Date(d.date);
              return dDate.toISOString().split('T')[0] === date;
            });
            const isBreak = monthData.breakDates && monthData.breakDates.some(b => {
              const bDate = new Date(b.date);
              return bDate.toISOString().split('T')[0] === date;
            });

            if (isDiningDay && !isDiningDay.isPast) {
              if (mode === 'add-break' && !isBreak) {
                newSet.add(date);
              } else if (mode === 'remove-break' && isBreak) {
                newSet.add(date);
              }
            }
          }
        }
      } else {
        // Single selection toggle
        if (newSet.has(dateStr)) {
          newSet.delete(dateStr);
        } else {
          newSet.add(dateStr);
        }
      }

      return newSet;
    });

    setLastClickedDate(dateStr);
  };

  const handleAddBreakMode = () => {
    if (mode === 'add-break') {
      setMode(null);
      setSelectedDates(new Set());
      setLastClickedDate(null);
      setBreakReason('');
    } else {
      setMode('add-break');
      setSelectedDates(new Set());
      setLastClickedDate(null);
      setBreakReason('');
    }
  };

  const handleRemoveBreakMode = () => {
    if (mode === 'remove-break') {
      setMode(null);
      setSelectedDates(new Set());
      setLastClickedDate(null);
      setBreakReason('');
    } else {
      setMode('remove-break');
      setSelectedDates(new Set());
      setLastClickedDate(null);
      setBreakReason('');
    }
  };

  const handleConfirmAddBreak = async () => {
    if (selectedDates.size === 0) {
      alert('Please select at least one date');
      return;
    }

    try {
      // Convert selected dates to sorted array
      const datesArray = Array.from(selectedDates).sort();
      const reason = breakReason.trim() || 'Break';
      await diningMonthAPI.addBreakDates({ dates: datesArray, reason });
      
      fetchCalendar();
      setMode(null);
      setSelectedDates(new Set());
      setLastClickedDate(null);
      setBreakReason('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to add breaks';
      console.log(err.response?.data);
      alert(errorMsg);
      setError(errorMsg);
    }
  };

  const handleConfirmRemoveBreak = async () => {
    if (selectedDates.size === 0) {
      alert('Please select at least one date');
      return;
    }

    try {
      // Convert selected dates to sorted array
      const datesArray = Array.from(selectedDates).sort();
      await diningMonthAPI.removeBreakDates({ dates: datesArray });
      
      fetchCalendar();
      setMode(null);
      setSelectedDates(new Set());
      setLastClickedDate(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to remove breaks';
      console.log(err.response?.data);
      alert(errorMsg);
      setError(errorMsg);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="adjust-dining-month-container">
      <h1>Adjust Dining Month</h1>

      {error && <div className="error">{error}</div>}

      {monthData && (
        <>
          <div className="stats-section">
            <div className="stat-card">
              <h3>Past Days</h3>
              <p className="stat-value">{monthData.stats.pastDaysCount}</p>
            </div>
            <div className="stat-card">
              <h3>Remaining Days</h3>
              <p className="stat-value">{monthData.stats.remainingDaysCount}</p>
            </div>
            <div className="stat-card">
              <h3>Total Days</h3>
              <p className="stat-value">{monthData.stats.totalDays}</p>
            </div>
          </div>

          <div className="calendar-section">
            <h2>Calendar</h2>
            <CalendarGrid 
              monthData={monthData} 
              selectedDates={selectedDates}
              onDateClick={handleDateClick}
              mode={mode}
            />
          </div>

          {mode && (
            <div className="selection-panel">
              {mode === 'add-break' && (
                <div className="break-reason-box">
                  <label htmlFor="break-reason">Reason for Break:</label>
                  <input
                    id="break-reason"
                    type="text"
                    placeholder="Enter reason (optional)"
                    value={breakReason}
                    onChange={(e) => setBreakReason(e.target.value)}
                    className="reason-input"
                  />
                </div>
              )}
              <div className="selected-dates-list">
                {selectedDates.size > 0 ? (
                  <>
                    <p className="selection-count">Selected: {selectedDates.size} date(s)</p>
                    <div className="dates-grid">
                      {Array.from(selectedDates).sort().map(dateStr => {
                        const diningDay = monthData.calendarDays.find(d => {
                          const dDate = new Date(d.date);
                          return dDate.toISOString().split('T')[0] === dateStr;
                        });
                        
                        const breakDay = monthData.breakDates?.find(b => {
                          const bDate = new Date(b.date);
                          return bDate.toISOString().split('T')[0] === dateStr;
                        });

                        const dayNum = diningDay ? String(diningDay.day).padStart(2, '0') : '??';
                        const date = new Date(dateStr);
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}`;

                        return (
                          <div key={dateStr} className="date-item">
                            Day {dayNum} - {formattedDate}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="selection-count">No dates selected</p>
                )}
              </div>

              <div className="selection-actions">
                <button 
                  className="action-button cancel-button"
                  onClick={mode === 'add-break' ? handleAddBreakMode : handleRemoveBreakMode}
                >
                  Cancel
                </button>
                {selectedDates.size > 0 && mode === 'add-break' && (
                  <button className="confirm-button" onClick={handleConfirmAddBreak}>
                    Add Breaks
                  </button>
                )}
                {selectedDates.size > 0 && mode === 'remove-break' && (
                  <button className="confirm-button" onClick={handleConfirmRemoveBreak}>
                    Remove Breaks
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="breaks-buttons">
            {mode !== 'add-break' && (
              <button 
                className="action-button"
                onClick={handleAddBreakMode}
                disabled={selectedDates.size > 0}
              >
                Add Break
              </button>
            )}
            {mode !== 'remove-break' && (
              <button 
                className="action-button"
                onClick={handleRemoveBreakMode}
                disabled={selectedDates.size > 0}
              >
                Remove Break
              </button>
            )}
          </div>

          <div className="breaks-section">
            <h2>Breaks</h2>

            {!mode && monthData.breakDates?.length > 0 ? (
              <div className="breaks-list">
                <h3>Current Breaks</h3>
                {monthData.breakDates.map((bd, idx) => {
                  const date = new Date(bd.date);
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}`;
                  return (
                    <div key={`break-${idx}`} className="break-item">
                      <p>
                        <strong>{formattedDate}</strong>
                        {bd.reason && ` - ${bd.reason}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : !mode ? (
              <p className="no-breaks">No breaks added</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
