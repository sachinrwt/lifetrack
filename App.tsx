
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import DayCell from './components/DayCell';
import { getCalendarDays } from './utils/dateUtils';
import { EntriesMap, EntryData } from './types';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<EntriesMap>({});

  // Load entries from local storage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('lifeTrackEntries');
    if (savedEntries) {
      try {
        const parsed = JSON.parse(savedEntries);
        const migratedEntries: EntriesMap = {};
        
        Object.keys(parsed).forEach(key => {
          const value = parsed[key];
          let newData: EntryData;

          // Handle legacy string format
          if (typeof value === 'string') {
             newData = { 
               logs: [{ id: Date.now().toString() + Math.random(), text: value }], 
               color: 'white',
               images: []
             };
          } else {
            // Handle object format (legacy content vs new logs)
            const logs = value.logs || [];
            // If old 'content' exists but no logs, migrate it
            if ((!logs || logs.length === 0) && value.content) {
                logs.push({ id: Date.now().toString() + Math.random(), text: value.content });
            }

            // Handle legacy image vs new images array
            const images = value.images || [];
            if ((!images || images.length === 0) && value.image) {
                images.push(value.image);
            }
            
            newData = {
                ...value,
                logs: logs,
                images: images,
                content: undefined, // Cleanup deprecated field
                image: undefined   // Cleanup deprecated field
            };
          }
          migratedEntries[key] = newData;
        });
        setEntries(migratedEntries);
      } catch (e) {
        console.error("Failed to parse entries", e);
      }
    }
  }, []);

  // Memoized calendar days to avoid recalculation on every render
  const calendarDays = useMemo(() => {
    return getCalendarDays(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const handleEntryChange = (dateStr: string, data: EntryData) => {
    setEntries(prev => {
      const newEntries = { ...prev, [dateStr]: data };
      localStorage.setItem('lifeTrackEntries', JSON.stringify(newEntries));
      return newEntries;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
    // Allow time for render if switching months, then scroll
    setTimeout(() => {
      const todayElement = document.getElementById('today-cell');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header 
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onGoToday={handleGoToday}
      />

      <main className="flex-1 p-2 sm:p-4 md:p-8 max-w-[1600px] mx-auto w-full">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Weekday Header - Hidden on Mobile as columns don't align with days */}
          <div className="hidden sm:grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid - 2 cols on mobile, 7 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-7 auto-rows-fr bg-gray-200 gap-[1px] sm:gap-0 sm:bg-transparent">
            {calendarDays.map((day, index) => {
              const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
              // Default entry if none exists
              const entryData = entries[dateKey] || { logs: [], color: 'white', weight: '', images: [] };
              
              return (
                <DayCell 
                  key={index}
                  date={day}
                  currentMonthDate={currentDate}
                  data={entryData}
                  onChange={handleEntryChange}
                />
              );
            })}
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} LifeTrack Calendar. Built by sachin.</p>
      </footer>
    </div>
  );
};

export default App;
