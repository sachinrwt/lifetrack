
import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { MONTH_NAMES } from '../utils/dateUtils';

interface HeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToday: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentDate, 
  onPrevMonth, 
  onNextMonth, 
  onGoToday,
}) => {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm px-3 py-3 sm:px-4 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
      <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-indigo-600 rounded-lg">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
              LifeTrack
            </h1>
        </div>
        
        {/* Mobile Only Actions */}
        <div className="flex sm:hidden items-center gap-2">
           <button
            onClick={onGoToday}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between w-full sm:w-auto bg-gray-100 rounded-full p-1 shadow-inner">
        <button 
          onClick={onPrevMonth}
          className="p-2 hover:bg-white rounded-full transition-all text-gray-600 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="flex-1 sm:flex-none sm:w-40 text-center font-semibold text-gray-800 select-none text-sm sm:text-base">
          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button 
          onClick={onNextMonth}
          className="p-2 hover:bg-white rounded-full transition-all text-gray-600 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Actions */}
      <div className="hidden sm:flex items-center gap-2">
         <button
          onClick={onGoToday}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Today
        </button>
      </div>
    </header>
  );
};

export default Header;