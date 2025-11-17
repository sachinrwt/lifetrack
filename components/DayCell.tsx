
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatDateKey, isSameDay, isSameMonth } from '../utils/dateUtils';
import { EntryData, LogEntry } from '../types';
import { Palette, Scale, Image as ImageIcon, X, Loader2, Plus, ArrowUp } from 'lucide-react';

interface DayCellProps { 
  date: Date;
  currentMonthDate: Date;
  data: EntryData;
  onChange: (dateStr: string, data: EntryData) => void;
}

// Define available colors with Tailwind classes
const COLORS = [
  { id: 'white', class: 'bg-white', label: 'Default' },
  { id: 'red', class: 'bg-rose-50', label: 'Red' },
  { id: 'orange', class: 'bg-orange-50', label: 'Orange' },
  { id: 'yellow', class: 'bg-amber-50', label: 'Yellow' },
  { id: 'green', class: 'bg-emerald-50', label: 'Green' },
  { id: 'blue', class: 'bg-sky-50', label: 'Blue' },
  { id: 'purple', class: 'bg-violet-50', label: 'Purple' },
  { id: 'pink', class: 'bg-pink-50', label: 'Pink' },
];

// Helper to compress image
const resizeImage = (file: File, maxWidth: number = 300): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        const finalScale = scale < 1 ? scale : 1;
        
        canvas.width = img.width * finalScale;
        canvas.height = img.height * finalScale;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const DayCell: React.FC<DayCellProps> = ({ date, currentMonthDate, data, onChange }) => {
  const [logs, setLogs] = useState<LogEntry[]>(data.logs || []);
  const [newLogText, setNewLogText] = useState('');
  const [currentColorId, setCurrentColorId] = useState(data.color || 'white');
  const [weight, setWeight] = useState(data.weight || '');
  
  // Support legacy 'image' field by checking it if 'images' is empty
  const [images, setImages] = useState<string[]>(
    data.images && data.images.length > 0 
      ? data.images 
      : (data.image ? [data.image] : [])
  );
  
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isToday = isSameDay(date, new Date());
  const isCurrentMonth = isSameMonth(date, currentMonthDate);
  const dateKey = formatDateKey(date);

  // Sync internal state if props change externally
  useEffect(() => {
    setLogs(data.logs || []);
    setCurrentColorId(data.color || 'white');
    setWeight(data.weight || '');
    setImages(data.images && data.images.length > 0 ? data.images : (data.image ? [data.image] : []));
  }, [data]);

  // Click outside to close color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveData = useCallback((newLogs: LogEntry[], newColor: string, newWeight: string, newImages: string[]) => {
     onChange(dateKey, { logs: newLogs, color: newColor, weight: newWeight, images: newImages });
  }, [dateKey, onChange]);

  const handleAddLog = () => {
    if (!newLogText.trim()) return;
    const newLog: LogEntry = { id: Date.now().toString() + Math.random().toString(36).slice(2), text: newLogText };
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    setNewLogText('');
    saveData(updatedLogs, currentColorId, weight, images);
  };

  const handleDeleteLog = (id: string) => {
    const updatedLogs = logs.filter(l => l.id !== id);
    setLogs(updatedLogs);
    saveData(updatedLogs, currentColorId, weight, images);
  };

  const handleUpdateLog = (id: string, text: string) => {
    const updatedLogs = logs.map(l => l.id === id ? { ...l, text } : l);
    setLogs(updatedLogs);
    saveData(updatedLogs, currentColorId, weight, images); 
  };

  const handleWeightBlur = () => {
    if (weight !== data.weight) {
      saveData(logs, currentColorId, weight, images);
    }
  };

  const handleColorSelect = (colorId: string) => {
    setCurrentColorId(colorId);
    setShowColorPicker(false);
    saveData(logs, colorId, weight, images);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      try {
        const newImages = [...images];
        
        // Process all selected files
        const processingPromises = Array.from(e.target.files).map(file => resizeImage(file as File));
        const processedImages = await Promise.all(processingPromises);
        
        newImages.push(...processedImages);
        setImages(newImages);
        saveData(logs, currentColorId, weight, newImages);
      } catch (err) {
        console.error("Error processing image", err);
        alert("Could not process one or more images.");
      } finally {
        setIsUploading(false);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    const newImages = images.filter((_, idx) => idx !== indexToRemove);
    setImages(newImages);
    saveData(logs, currentColorId, weight, newImages);
  };

  const activeColorClass = COLORS.find(c => c.id === currentColorId)?.class || 'bg-white';
  const containerBgClass = !isCurrentMonth ? 'bg-gray-50/50' : activeColorClass;

  return (
    <>
      <div 
        id={isToday ? 'today-cell' : undefined}
        className={`
          flex flex-col min-h-[160px] sm:min-h-[180px] sm:h-56 border-gray-200 p-1.5 sm:p-2 transition-colors relative group
          sm:border-b sm:border-r 
          ${containerBgClass}
          ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
          ${isToday ? 'ring-inset ring-2 ring-indigo-200' : ''}
        `}
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-1 relative z-10 h-6 sm:h-7 shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <div 
              className={`
                flex items-center justify-center rounded-full transition-colors
                ${isToday ? 'bg-indigo-600 text-white shadow-md px-2 py-0.5' : 'text-gray-700'}
                ${!isCurrentMonth ? 'opacity-50' : ''}
                ${isCurrentMonth && currentColorId !== 'white' ? 'bg-white/50 px-1.5 rounded-md' : ''}
              `}
            >
              {/* Mobile: Show Weekday + Date. Desktop: Show Date Only */}
              <span className="text-[10px] sm:hidden font-medium uppercase tracking-wide mr-1 opacity-70">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-sm font-semibold">
                {date.getDate()}
              </span>
            </div>
          </div>

          {/* Controls Area */}
          {isCurrentMonth && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              
              {/* Weight Input */}
              <div 
                className={`
                  flex items-center gap-0.5 px-1 py-0.5 rounded-md transition-all duration-200
                  ${weight ? 'bg-white/50 border border-gray-100 opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 border border-transparent hover:bg-white/80'}
                `} 
                title="Track weight"
              >
                <Scale className={`w-3 h-3 ${weight ? 'text-indigo-600' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  onBlur={handleWeightBlur}
                  placeholder="#"
                  className="w-6 sm:w-8 text-[10px] sm:text-xs bg-transparent border-none outline-none text-right text-gray-900 placeholder-gray-300 font-bold"
                />
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-500">kg</span>
              </div>

               {/* Image Upload Trigger */}
               <div className="relative">
                 <input 
                   type="file" 
                   ref={fileInputRef}
                   accept="image/*"
                   multiple
                   className="hidden"
                   onChange={handleImageUpload}
                 />
                 <button
                   onClick={() => fileInputRef.current?.click()}
                   disabled={isUploading}
                   className={`
                     p-1 sm:p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 
                     transition-all duration-200
                     ${isUploading ? 'opacity-100 cursor-wait' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}
                     ${images.length > 0 ? 'text-indigo-500' : ''}
                   `}
                   title="Attach photos"
                 >
                   {isUploading ? (
                     <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-indigo-500" />
                   ) : (
                     <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                   )}
                 </button>
               </div>

              {/* Color Picker Trigger */}
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`
                    p-1 sm:p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-600 
                    transition-all duration-200
                    ${showColorPicker ? 'opacity-100 bg-black/5 text-gray-600' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}
                  `}
                  title="Color code this day"
                >
                  <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>

                {/* Color Picker Popup */}
                {showColorPicker && (
                  <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex gap-1 animate-in zoom-in-95 duration-100 origin-top-right min-w-[160px] sm:min-w-[176px] flex-wrap justify-end">
                    {COLORS.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => handleColorSelect(color.id)}
                        className={`
                          w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-gray-200 shadow-sm hover:scale-110 transition-transform
                          ${color.class}
                          ${currentColorId === color.id ? 'ring-2 ring-offset-1 ring-gray-400' : ''}
                        `}
                        title={color.label}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Logs Container */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-0.5 custom-scrollbar mb-1 flex flex-col gap-1">
           {logs.map((log) => (
              <div key={log.id} className="relative group/log animate-in fade-in slide-in-from-bottom-1 duration-200">
                <textarea
                   value={log.text}
                   onChange={(e) => handleUpdateLog(log.id, e.target.value)}
                   className="w-full bg-white/40 hover:bg-white/60 focus:bg-white border border-transparent focus:border-indigo-200 rounded-md p-1.5 text-[11px] sm:text-xs shadow-sm resize-none outline-none transition-all placeholder-gray-400 text-gray-700"
                   rows={Math.max(1, Math.min(4, Math.ceil(log.text.length / 30)))}
                   spellCheck={false}
                />
                {isCurrentMonth && (
                   <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="absolute -top-1 -right-1 p-0.5 bg-white text-gray-400 hover:text-red-500 rounded-full border border-gray-100 shadow-sm opacity-0 group-hover/log:opacity-100 transition-opacity"
                   >
                     <X className="w-2.5 h-2.5" />
                   </button>
                )}
              </div>
           ))}
        </div>

        {/* Add Log Input */}
        {isCurrentMonth && (
          <div className="relative mt-auto shrink-0">
            <div className="flex items-center gap-1 border-t border-black/5 pt-1">
               <Plus className="w-3 h-3 text-gray-400" />
               <input 
                  type="text"
                  value={newLogText}
                  onChange={(e) => setNewLogText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
                  placeholder="Add entry..."
                  className="w-full bg-transparent text-xs outline-none placeholder-gray-400 text-gray-700 py-0.5"
               />
              {/* Mobile Submit Button */}
               <button
                 onClick={handleAddLog}
                 disabled={!newLogText.trim()}
                 className={`
                   sm:hidden shrink-0 p-1 rounded-md transition-colors
                   ${newLogText.trim() ? 'text-indigo-600 bg-indigo-50 active:bg-indigo-100' : 'text-gray-300'} 
                 `}
               >
                 <ArrowUp className="w-3.5 h-3.5" />
               </button>
            </div>
          </div>
        )}

        {/* Image Thumbnails (Scrollable List) */}
        {images.length > 0 && (
          <div className="mt-1.5 pt-1 border-t border-black/5 flex gap-1 overflow-x-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300 shrink-0 pb-1">
             {images.map((img, idx) => (
               <div key={idx} className="relative group/img shrink-0">
                  <img 
                    src={img} 
                    alt={`Attachment ${idx + 1}`} 
                    className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded-md border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02]"
                    onClick={() => setSelectedImageIndex(idx)}
                  />
                  {isCurrentMonth && (
                    <button 
                      onClick={(e) => handleRemoveImage(e, idx)}
                      className="absolute -top-1.5 -right-1.5 bg-white text-gray-400 hover:text-red-500 border border-gray-100 rounded-full p-0.5 shadow-sm opacity-0 group-hover/img:opacity-100 transition-all transform hover:scale-110"
                    >
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  )}
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Full Screen Image Modal */}
      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 p-4" onClick={() => setSelectedImageIndex(null)}>
           <div 
            className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} 
           >
              <img src={images[selectedImageIndex]} alt="Full view" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
              <button 
                onClick={() => setSelectedImageIndex(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="absolute -bottom-12 left-0 right-0 text-center pointer-events-none">
                 <span className="bg-white/10 backdrop-blur-md text-white/90 px-4 py-1.5 rounded-full text-sm font-medium">
                   {date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • Photo {selectedImageIndex + 1} of {images.length}
                 </span>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default DayCell;
