import React, { useState, useRef, useEffect } from 'react';
import '../styles/components/BookingDatePicker.scss';

interface BookingDatePickerProps {
  departureDate?: string | null;
  arrivalDate?: string | null;
  onDatesChange: (departure: string | null, arrival: string | null) => void;
  minDate?: string; // Data minima selezionabile
}

const BookingDatePicker: React.FC<BookingDatePickerProps> = ({
  departureDate,
  arrivalDate,
  onDatesChange,
  minDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    departureDate ? new Date(departureDate) : null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    arrivalDate ? new Date(arrivalDate) : null
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const minDateObj = minDate ? new Date(minDate) : new Date();
  minDateObj.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (departureDate) {
      setSelectedStartDate(new Date(departureDate));
    } else {
      setSelectedStartDate(null);
    }
    if (arrivalDate) {
      setSelectedEndDate(new Date(arrivalDate));
    } else {
      setSelectedEndDate(null);
    }
  }, [departureDate, arrivalDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

    const days = [];
    // Aggiungi giorni vuoti per allineare il calendario
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Aggiungi i giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < minDateObj;
  };

  const isDateInRange = (date: Date): boolean => {
    if (!selectedStartDate || !selectedEndDate) {
      // Controlla se è nell'intervallo tra start e hover (durante la selezione)
      if (selectedStartDate && hoverDate && !selectedEndDate) {
        const start = new Date(selectedStartDate);
        const end = new Date(hoverDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        
        if (start > end) {
          return checkDate >= end && checkDate <= start;
        }
        return checkDate >= start && checkDate <= end;
      }
      return false;
    }

    const start = new Date(selectedStartDate);
    const end = new Date(selectedEndDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate >= start && checkDate <= end;
  };

  const isStartDate = (date: Date): boolean => {
    if (!selectedStartDate) return false;
    const start = new Date(selectedStartDate);
    const checkDate = new Date(date);
    start.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return start.getTime() === checkDate.getTime();
  };

  const isEndDate = (date: Date): boolean => {
    if (!selectedEndDate) return false;
    const end = new Date(selectedEndDate);
    const checkDate = new Date(date);
    end.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return end.getTime() === checkDate.getTime();
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Prima selezione o reset
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setHoverDate(null);
      setIsOpen(true);
    } else {
      // Seconda selezione
      const start = new Date(selectedStartDate);
      const end = new Date(date);
      
      if (end < start) {
        // Se la seconda data è prima della prima, scambia
        setSelectedStartDate(end);
        setSelectedEndDate(start);
        const endStr = formatDateForInput(end);
        const startStr = formatDateForInput(start);
        onDatesChange(endStr, startStr);
      } else {
        setSelectedEndDate(end);
        const startStr = formatDateForInput(selectedStartDate);
        const endStr = formatDateForInput(date);
        onDatesChange(startStr, endStr);
      }
      setHoverDate(null);
      // Chiudi il calendario dopo aver selezionato entrambe le date
      setTimeout(() => {
        setIsOpen(false);
      }, 300);
    }
  };

  const handleDateHover = (date: Date) => {
    if (selectedStartDate && !selectedEndDate && !isDateDisabled(date)) {
      setHoverDate(date);
    }
  };

  const handleReset = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setHoverDate(null);
    onDatesChange(null, null);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  const dayNames = ['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa'];

  return (
    <div className="booking-date-picker" ref={calendarRef}>
      <div className="date-inputs">
        <div 
          className={`date-input ${selectedStartDate ? 'has-value' : ''} ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="date-input-label">
            <i className="fas fa-calendar-check"></i>
            Partenza
          </div>
          <div className="date-input-value">
            {selectedStartDate ? formatDateForDisplay(selectedStartDate) : 'Aggiungi date'}
          </div>
        </div>
        <div 
          className={`date-input ${selectedEndDate ? 'has-value' : ''} ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="date-input-label">
            <i className="fas fa-calendar-times"></i>
            Arrivo
          </div>
          <div className="date-input-value">
            {selectedEndDate ? formatDateForDisplay(selectedEndDate) : 'Aggiungi date'}
          </div>
        </div>
        {(selectedStartDate || selectedEndDate) && (
          <button className="clear-dates-btn" onClick={handleReset} title="Cancella date">
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="calendar-popup" onMouseLeave={() => setHoverDate(null)}>
          <div className="calendar-header">
            <button 
              className="nav-button prev" 
              onClick={() => navigateMonth('prev')}
              disabled={currentMonth.getMonth() === minDateObj.getMonth() && currentMonth.getFullYear() === minDateObj.getFullYear()}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="month-year">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button 
              className="nav-button next" 
              onClick={() => navigateMonth('next')}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {dayNames.map((day, index) => (
                <div key={index} className="weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {days.map((date, index) => {
                if (date === null) {
                  return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                }

                const disabled = isDateDisabled(date);
                const inRange = isDateInRange(date);
                const isStart = isStartDate(date);
                const isEnd = isEndDate(date);

                return (
                  <div
                    key={date.getTime()}
                    className={`calendar-day ${disabled ? 'disabled' : ''} ${inRange ? 'in-range' : ''} ${isStart ? 'start-date' : ''} ${isEnd ? 'end-date' : ''}`}
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => handleDateHover(date)}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          {selectedStartDate && selectedEndDate && (
            <div className="calendar-footer">
              <div className="selected-dates-info">
                <span>
                  <strong>{formatDateForDisplay(selectedStartDate)}</strong> - <strong>{formatDateForDisplay(selectedEndDate)}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingDatePicker;

