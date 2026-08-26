'use client';

import { CalendarEventDto } from '@/types/calendar';
import { AlertCircle, Video, FileText, Bell, Clock } from 'lucide-react';

interface EventsListProps {
  events: CalendarEventDto[];
  selectedDate: Date | null;
  onEventClick: (event: CalendarEventDto) => void;
  loading: boolean;
}

export default function EventsList({
  events,
  selectedDate,
  onEventClick,
  loading,
}: EventsListProps) {
  const getIconForEventType = (type: string) => {
    switch (type) {
      case 'LIVE_CLASS':
        return <Video size={16} className="text-blue-400" />;
      case 'ASSIGNMENT_DUE':
        return <FileText size={16} className="text-orange-400" />;
      case 'ANNOUNCEMENT':
        return <Bell size={16} className="text-green-400" />;
      case 'QUIZ_ATTEMPT':
        return <Clock size={16} className="text-purple-400" />;
      default:
        return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusColorMap: Record<string, string> = {
      SCHEDULED: 'bg-blue-900/30 text-blue-400 border-blue-500/30',
      LIVE: 'bg-red-900/30 text-red-400 border-red-500/30',
      COMPLETED: 'bg-green-900/30 text-green-400 border-green-500/30',
      CANCELLED: 'bg-gray-900/30 text-gray-400 border-gray-500/30',
      OVERDUE: 'bg-red-900/40 text-red-300 border-red-500/50',
      PUBLISHED: 'bg-green-900/30 text-green-400 border-green-500/30',
      DRAFT: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30',
    };
    return statusColorMap[status] || 'bg-neutral-800 text-neutral-400 border-neutral-700';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!selectedDate) {
    return (
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Events</h3>
        <p className="text-neutral-400 text-sm text-center py-8">
          Select a date to view events
        </p>
      </div>
    );
  }

  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{dateLabel}</h3>
        <p className="text-neutral-400 text-sm">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-neutral-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && events.length === 0 && (
        <p className="text-neutral-500 text-sm text-center py-8">
          No events on this date
        </p>
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => onEventClick(event)}
              className="w-full text-left bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 hover:border-neutral-600 hover:bg-neutral-800 transition-colors group"
            >
              {/* Event header */}
              <div className="flex items-start gap-3 mb-2">
                <div className="mt-0.5">
                  {getIconForEventType(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm group-hover:text-blue-400 transition-colors truncate">
                    {event.title}
                  </h4>
                  <p className="text-neutral-400 text-xs truncate">
                    {event.courseName}
                  </p>
                </div>
              </div>

              {/* Event details */}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(event.status)}`}
                >
                  {event.status}
                </span>
                {event.endDate && (
                  <span className="text-xs text-neutral-500">
                    {formatTime(event.date)} - {formatTime(event.endDate)}
                  </span>
                )}
                {!event.endDate && (
                  <span className="text-xs text-neutral-500">
                    {formatTime(event.date)}
                  </span>
                )}
              </div>

              {/* Event description preview */}
              {event.description && (
                <p className="text-neutral-400 text-xs mt-2 line-clamp-2">
                  {event.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
