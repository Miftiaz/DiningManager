import React from 'react';

export default function CalendarGrid({ monthData, selectedDates = new Set(), onDateClick, mode, purchasedDates = new Set() }) {
  const renderCalendarGrid = (data) => {
    const months = {};
    
    // Group dining days by month
    data.calendarDays.forEach((day) => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!months[monthKey]) {
        months[monthKey] = { month: date.getMonth(), year: date.getFullYear(), diningDays: [], breakDays: [] };
      }
      months[monthKey].diningDays.push(day);
    });

    // Group break days by month
    if (data.breakDates) {
      data.breakDates.forEach((breakDay) => {
        const date = new Date(breakDay.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!months[monthKey]) {
          months[monthKey] = { month: date.getMonth(), year: date.getFullYear(), diningDays: [], breakDays: [] };
        }
        months[monthKey].breakDays.push(breakDay);
      });
    }

    return Object.entries(months).map(([key, monthInfo]) => {
      const firstDay = new Date(monthInfo.year, monthInfo.month, 1);
      const lastDay = new Date(monthInfo.year, monthInfo.month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const calendarCells = [];
      
      // Add empty cells for days before month starts
      for (let i = 0; i < startingDayOfWeek; i++) {
        calendarCells.push(<div key={`empty-start-${i}`} className="empty-day"></div>);
      }
      
      // Add all days in the month
      // Get today's date in local timezone
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      for (let day = 1; day <= daysInMonth; day++) {
        const diningDay = monthInfo.diningDays.find(d => {
          const dDate = new Date(d.date);
          return dDate.getDate() === day;
        });

        const isBreakDay = monthInfo.breakDays && monthInfo.breakDays.some(b => {
          const bDate = new Date(b.date);
          return bDate.getDate() === day;
        });

        let dateStr;
        if (diningDay) {
          const d = new Date(diningDay.date);
          dateStr = d.toISOString().split('T')[0];
        } else if (isBreakDay) {
          const breakDate = monthInfo.breakDays.find(b => {
            const bDate = new Date(b.date);
            return bDate.getDate() === day;
          });
          const d = new Date(breakDate.date);
          dateStr = d.toISOString().split('T')[0];
        } else {
          // For empty cells, use UTC date
          const d = new Date(Date.UTC(monthInfo.year, monthInfo.month, day));
          dateStr = d.toISOString().split('T')[0];
        }
        const isSelected = dateStr && selectedDates.has(dateStr);
        const isToday = dateStr === todayStr;
        const isPastDate = dateStr < todayStr;
        
        const handleDateClick = (e) => {
          if (!mode) return; // Don't allow selection without a mode
          
          // If in remove-break mode, only allow clicking non-past break days
          if (mode === 'remove-break') {
            if (isBreakDay && !isPastDate && !isToday && onDateClick) {
              onDateClick(dateStr, e.shiftKey, isBreakDay);
            }
            return;
          }
          
          // In add-break mode (adjust/return mode for ManageBorder)
          if (mode === 'add-break' || mode === 'return-token') {
            if (diningDay && !isPastDate && !isToday && onDateClick) {
              onDateClick(dateStr, e.shiftKey, isBreakDay);
            }
            return;
          }
        };

        let isClickable = false;
        const isPurchased = purchasedDates.has(dateStr);
        
        if (mode === 'remove-break') {
          isClickable = isBreakDay && !isPastDate && !isToday;
        } else if (mode === 'add-break') {
          // In adjust mode: can click non-purchased dining days (not today)
          isClickable = diningDay && !isPastDate && !isToday && !isPurchased;
        } else if (mode === 'return-token') {
          // In return mode: can only click purchased dining days (not today)
          isClickable = diningDay && !isPastDate && !isToday && isPurchased;
        }
        
        const breakDayObject = isBreakDay ? monthInfo.breakDays.find(b => {
          const bDate = new Date(b.date);
          return bDate.getDate() === day;
        }) : null;

        calendarCells.push(
          <div
            key={`day-${day}`}
            className={`calendar-cell ${diningDay ? 'dining-day' : ''} ${diningDay?.isPast ? 'past' : ''} ${isBreakDay ? 'break' : ''} ${isClickable ? 'clickable' : ''} ${isSelected ? 'selected' : ''} ${isSelected && mode === 'return-token' ? 'return-selected' : ''} ${isPurchased ? 'purchased' : ''} ${isToday ? 'today' : ''}`}
            onClick={handleDateClick}
            title={breakDayObject ? breakDayObject.reason : ''}
          >
            <span className="cell-day">{day}</span>
            {diningDay && <span className="dining-number">Day {diningDay.day}</span>}
            {isBreakDay && <span className="break-indicator">Break</span>}
          </div>
        );
      }
      
      // Add empty cells for remaining weeks
      const totalCells = calendarCells.length;
      const remainingCells = (7 - (totalCells % 7)) % 7;
      for (let i = 0; i < remainingCells; i++) {
        calendarCells.push(<div key={`empty-end-${i}`} className="empty-day"></div>);
      }
      
      return (
        <div key={key} className="month-calendar">
          <h3>{firstDay.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <div className="calendar-month">
            <div className="weekdays">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            <div className="calendar-dates">
              {calendarCells}
            </div>
          </div>
        </div>
      );
    });
  };

  return <div className="monthly-calendars">{renderCalendarGrid(monthData)}</div>;
}
