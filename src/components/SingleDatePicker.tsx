import React, { useState, useRef, useEffect } from 'react';
import '../styles/components/SingleDatePicker.scss';

interface SingleDatePickerProps {
  value?: string;
  onChange: (date: string | null) => void;
  minDate?: string;
  placeholder?: string;
  disabled?: boolean;
}

const SingleDatePicker: React.FC<SingleDatePickerProps> = ({
  value,
  onChange,
  minDate,
  placeholder = 'Seleziona data',
  disabled = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [isOpen, setIsOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const minDateObj = minDate ? new Date(minDate) : new Date();
  minDateObj.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth()));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

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

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isDateDisabled = (date: Date): boolean => {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    return dateOnly < minDateObj;
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (isDateDisabled(date)) return;

    setSelectedDate(date);
    onChange(formatDate(date));
    setIsOpen(false);
  };

  const clearDate = () => {
    setSelectedDate(null);
    onChange(null);
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days: (number | null)[] = [];

  // Aggiungi giorni vuoti all'inizio
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Aggiungi i giorni del mese
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const selectedDateStr = selectedDate ? formatDate(selectedDate) : null;
  const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const canGoPrev = currentMonthStart > minDateObj;

  return (
    <div className="single-date-picker" ref={calendarRef}>
      <div
        className={`date-input-wrapper ${isOpen ? 'active' : ''} ${selectedDate ? 'has-value' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="date-input">
          {selectedDate ? (
            <div className="date-value">
              <i className="fas fa-calendar-check"></i>
              <span>{formatDisplayDate(selectedDate)}</span>
            </div>
          ) : (
            <div className="date-placeholder">
              <i className="fas fa-calendar"></i>
              <span>{placeholder}</span>
            </div>
          )}
        </div>
        {selectedDate && !disabled && (
          <button
            className="clear-date-btn"
            onClick={(e) => {
              e.stopPropagation();
              clearDate();
            }}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
        <div className="date-input-icon">
          <i className="fas fa-chevron-down"></i>
        </div>
      </div>

      {isOpen && (
        <div className="calendar-popup">
          <div className="calendar-header">
            <button
              className="nav-button"
              onClick={() => navigateMonth('prev')}
              disabled={!canGoPrev}
              type="button"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="month-year">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              className="nav-button"
              onClick={() => navigateMonth('next')}
              type="button"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {weekDays.map((day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
            </div>
            <div className="calendar-days">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                }

                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const isDisabled = isDateDisabled(date);
                const isSelected =
                  selectedDateStr && formatDate(date) === selectedDateStr;
                const dateStr = formatDate(date);

                return (
                  <div
                    key={`day-${day}`}
                    className={`calendar-day ${isDisabled ? 'disabled' : ''} ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => !isDisabled && handleDateSelect(day)}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleDatePicker;

