'use client';

/**
 * Calendar Page Component
 *
 * Main calendar interface for instructors and admins to view aggregated events
 * from their courses across all event types (Live Classes, Assignments, Announcements).
 *
 * Features:
 * - Month-based calendar view with event indicators
 * - Event list sidebar for selected date
 * - Event details modal for in-depth information
 * - Month navigation (previous/next/today)
 * - RBAC: Instructors see own courses, admins see all
 * - Loading, error, and empty states
 *
 * Event Sources:
 * - Live Classes (blue, video icon)
 * - Assignment Due Dates (orange, file icon)
 * - Published Announcements (green, bell icon)
 *
 * Date Handling:
 * - Uses browser's local timezone for display
 * - Sends/receives ISO 8601 UTC dates to/from backend
 * - Supports all standard calendar interactions
 *
 * Performance:
 * - Fetches events monthly (efficient date ranges)
 * - Events cached until month changes
 * - Lazy loads event details on click
 *
 * @component
 * @example
 * // In /dashboard/instructor/calendar/page.tsx
 * import CalendarPage from './components/Calendar/CalendarPage';
 * export default function InstructorCalendar() {
 *   return <CalendarPage />;
 * }
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Calendar } from 'lucide-react';
import DatePicker from './DatePicker';
import CalendarView from './CalendarView';
import EventsList from './EventsList';
import EventDetailsModal from './EventDetailsModal';
import { CalendarEventDto } from '@/types/calendar';

const API = 'http://localhost:4000';

export default function CalendarPage() {
  const { token, user } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDto | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check authorization
  useEffect(() => {
    if (user && user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      setError('Access denied. Only instructors and admins can view the calendar.');
    }
  }, [user]);

  // Fetch calendar events
  useEffect(() => {
    if (!token || error) return;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');

        // Calculate month start and end dates
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const startDateISO = startDate.toISOString().split('T')[0];
        const endDateISO = endDate.toISOString().split('T')[0];

        const res = await fetch(
          `${API}/calendar?startDate=${startDateISO}T00:00:00Z&endDate=${endDateISO}T23:59:59Z`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Unauthorized. Please log in again.');
          } else if (res.status === 403) {
            throw new Error('Access denied.');
          } else {
            throw new Error('Failed to load calendar events');
          }
        }

        const data = await res.json();
        setEvents(data.events || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load calendar events');
      } finally {
        setLoading(false);
      }
    };

    void fetchEvents();
  }, [token, currentDate, error]);

  // Get events for selected date
  const selectedDateEvents = selectedDate
    ? events.filter((event) => {
        const eventDate = new Date(event.date).toDateString();
        return eventDate === selectedDate.toDateString();
      })
    : [];

  const handleEventClick = (event: CalendarEventDto) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  if (error && !token) {
    return (
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 text-red-400 mb-4">
          <AlertCircle size={20} />
          <h2 className="text-lg font-semibold">{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="text-blue-500 h-6 w-6" />
        <h1 className="text-2xl font-bold text-white">Instructor Calendar</h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Date picker */}
      <DatePicker currentDate={currentDate} onDateChange={setCurrentDate} />

      {/* Main layout: Calendar + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar view (2 columns) */}
        <div className="lg:col-span-2">
          <CalendarView
            currentDate={currentDate}
            events={events}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            loading={loading}
          />
        </div>

        {/* Sidebar: Events list (1 column) */}
        <div>
          <EventsList
            events={selectedDateEvents}
            selectedDate={selectedDate}
            onEventClick={handleEventClick}
            loading={loading}
          />
        </div>
      </div>

      {/* Event details modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
