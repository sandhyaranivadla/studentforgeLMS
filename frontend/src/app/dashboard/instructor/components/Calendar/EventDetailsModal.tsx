'use client';

import { CalendarEventDto } from '@/types/calendar';
import { X, Video, FileText, Bell, Clock, ExternalLink } from 'lucide-react';

interface EventDetailsModalProps {
  event: CalendarEventDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailsModal({
  event,
  isOpen,
  onClose,
}: EventDetailsModalProps) {
  if (!isOpen || !event) return null;

  const getIconForEventType = (type: string) => {
    switch (type) {
      case 'LIVE_CLASS':
        return <Video size={24} className="text-blue-400" />;
      case 'ASSIGNMENT_DUE':
        return <FileText size={24} className="text-orange-400" />;
      case 'ANNOUNCEMENT':
        return <Bell size={24} className="text-green-400" />;
      case 'QUIZ_ATTEMPT':
        return <Clock size={24} className="text-purple-400" />;
      default:
        return null;
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      LIVE_CLASS: 'Live Class',
      ASSIGNMENT_DUE: 'Assignment Due',
      ANNOUNCEMENT: 'Announcement',
      QUIZ_ATTEMPT: 'Quiz Attempt',
    };
    return labelMap[type] || type;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDurationString = () => {
    if (!event.endDate) return null;

    const start = new Date(event.date);
    const end = new Date(event.endDate);
    const durationMs = end.getTime() - start.getTime();
    const durationMin = Math.floor(durationMs / 1000 / 60);

    if (durationMin < 60) {
      return `${durationMin} minutes`;
    } else {
      const hours = Math.floor(durationMin / 60);
      const mins = durationMin % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colorMap: Record<string, string> = {
      SCHEDULED: 'bg-blue-900/30 text-blue-300 border-blue-500/30',
      LIVE: 'bg-red-900/30 text-red-300 border-red-500/30',
      COMPLETED: 'bg-green-900/30 text-green-300 border-green-500/30',
      CANCELLED: 'bg-gray-900/30 text-gray-300 border-gray-500/30',
      OVERDUE: 'bg-red-900/40 text-red-200 border-red-500/50',
      PUBLISHED: 'bg-green-900/30 text-green-300 border-green-500/30',
      DRAFT: 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30',
    };
    return colorMap[status] || 'bg-neutral-800 text-neutral-300 border-neutral-700';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 flex items-start justify-between p-6 border-b border-neutral-800 bg-neutral-950">
            <div className="flex items-start gap-4">
              <div className="mt-1">{getIconForEventType(event.type)}</div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white truncate">
                  {event.title}
                </h2>
                <p className="text-neutral-400 text-sm mt-1">
                  {getEventTypeLabel(event.type)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Course info */}
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
              <p className="text-neutral-400 text-sm mb-1">Course</p>
              <p className="text-white font-medium">{event.courseName}</p>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-3">
              <span className="text-neutral-400 text-sm">Status:</span>
              <span
                className={`text-sm px-3 py-1 rounded-full border ${getStatusBadgeColor(event.status)}`}
              >
                {event.status}
              </span>
            </div>

            {/* Date and time info */}
            <div className="space-y-3">
              <p className="text-neutral-400 text-sm font-medium">Date & Time</p>
              <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 space-y-2">
                <p className="text-white">
                  {formatDateTime(event.date)}
                </p>
                {event.endDate && (
                  <>
                    <p className="text-neutral-400 text-sm">
                      Duration: {getDurationString()}
                    </p>
                    <p className="text-neutral-400 text-sm">
                      Ends: {formatDateTime(event.endDate)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="space-y-3">
                <p className="text-neutral-400 text-sm font-medium">Details</p>
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
                  <p className="text-white text-sm whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* Metadata */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="space-y-3">
                <p className="text-neutral-400 text-sm font-medium">
                  Additional Info
                </p>
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 space-y-2">
                  {event.metadata.maxMarks !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400 text-sm">Max Marks:</span>
                      <span className="text-white font-medium">
                        {event.metadata.maxMarks}
                      </span>
                    </div>
                  )}
                  {event.metadata.zoomMeetingId && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 text-sm">Zoom Meeting:</span>
                      <span className="text-blue-400 text-sm">
                        {event.metadata.zoomMeetingId}
                      </span>
                    </div>
                  )}
                  {event.metadata.instructorId && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400 text-sm">Instructor:</span>
                      <span className="text-white text-sm">
                        {event.metadata.instructorId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Event type specific info */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <ExternalLink size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-300">
                  Click the event title to view more details in the relevant section
                  (assignments, live classes, etc.)
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t border-neutral-800 bg-neutral-950">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
