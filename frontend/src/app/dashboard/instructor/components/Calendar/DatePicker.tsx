'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DatePicker({
  currentDate,
  onDateChange,
}: DatePickerProps) {
  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          title="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold text-white min-w-48 text-center">
          {monthName}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          title="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <button
        onClick={handleToday}
        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Today
      </button>
    </div>
  );
}
