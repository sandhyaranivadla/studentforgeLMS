'use client';

import { useMemo } from 'react';
import { CalendarEventDto } from '@/types/calendar';
import { Dot } from 'lucide-react';

interface CalendarViewProps {
  currentDate: Date;
  events: CalendarEventDto[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  loading: boolean;
}

export default function CalendarView({
  currentDate,
  events,
  selectedDate,
  onDateSelect,
  loading,
}: CalendarViewProps) {
  const { daysInMonth, firstDayOfMonth, daysArray } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return { daysInMonth, firstDayOfMonth, daysArray };
  }, [currentDate]);

  // Create a map of dates to events for quick lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventDto[]>();

    events.forEach((event) => {
      const dateKey = new Date(event.date)
        .toISOString()
        .split('T')[0]; // YYYY-MM-DD
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });

    return map;
  }, [events]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getColorForEventType = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      red: 'bg-red-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onDateSelect(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      selectedDate &&
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Empty cells for days before month starts
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-neutral-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells before month starts */}
        {emptyDays.map((i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of month */}
        {daysArray.map((day) => {
          const dateKey = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day,
          )
            .toISOString()
            .split('T')[0];

          const dayEvents = eventsByDate.get(dateKey) || [];
          const isSelectedDay = isSelected(day);
          const isTodayDay = isToday(day);

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={loading}
              className={`
                aspect-square flex flex-col items-start justify-start p-2 rounded-lg 
                border transition-all cursor-pointer disabled:opacity-50
                ${
                  isSelectedDay
                    ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/30'
                    : isTodayDay
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800'
                }
              `}
            >
              {/* Day number */}
              <span
                className={`text-sm font-medium ${
                  isSelectedDay || isTodayDay
                    ? 'text-blue-400'
                    : 'text-white'
                }`}
              >
                {day}
              </span>

              {/* Event indicators */}
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 flex-1">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <Dot
                      key={idx}
                      size={8}
                      className={`${getColorForEventType(event.color)} fill-current`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-xs text-neutral-400 leading-none">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar info */}
      <div className="mt-6 pt-4 border-t border-neutral-800">
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-neutral-400">Live Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-neutral-400">Assignment Due</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-neutral-400">Announcement</span>
          </div>
        </div>
      </div>
    </div>
  );
}
