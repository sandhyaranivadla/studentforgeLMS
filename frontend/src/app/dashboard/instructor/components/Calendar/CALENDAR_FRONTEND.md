# Calendar Frontend Documentation

## Overview

The Calendar component provides an interactive month-based calendar view for instructors and admins to visualize and manage important LMS events. It aggregates Live Classes, Assignment Due Dates, and Announcements into a unified calendar interface.

## Components

### 1. CalendarPage
**File:** `CalendarPage.tsx`

Main container component that manages state and API communication.

**Props:** None (uses `useAuth` hook)

**State:**
- `currentDate`: Currently displayed month
- `selectedDate`: User-selected date for sidebar display
- `events`: All calendar events for current month
- `selectedEvent`: Event opened in modal
- `loading`: API loading state
- `error`: Error messages

**Features:**
- Fetches events for visible month on mount and when month changes
- Handles RBAC (redirects non-instructors)
- Manages event modal open/close
- Displays loading, error, and empty states

**API Integration:**
```typescript
GET /calendar?startDate=YYYY-MM-01T00:00:00Z&endDate=YYYY-MM-DDT23:59:59Z
Headers: Authorization: Bearer <token>
```

---

### 2. DatePicker
**File:** `DatePicker.tsx`

Header component for month navigation.

**Props:**
```typescript
interface DatePickerProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}
```

**Features:**
- Display current month/year
- Previous month button
- Next month button
- Today button (jump to current month)
- Keyboard-friendly navigation

**Styling:**
- Blue highlight on active month
- Hover states on all buttons
- Responsive on mobile

---

### 3. CalendarView
**File:** `CalendarView.tsx`

Main calendar grid component showing month layout.

**Props:**
```typescript
interface CalendarViewProps {
  currentDate: Date;
  events: CalendarEventDto[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  loading: boolean;
}
```

**Features:**
- 7-column grid (Sun-Sat)
- Event indicators as colored dots
- Highlight selected date
- Highlight current day (today)
- Click dates to select
- Show up to 3 event dots per day
- "+N more" indicator for overflow

**Color Mapping:**
- Blue: Live Classes
- Orange: Assignment Due Dates
- Green: Announcements
- Purple: Quiz Attempts (future)

**Accessibility:**
- Keyboard navigable
- Clear visual hierarchy
- High contrast colors
- Date labels always visible

**Performance:**
- Memoized event lookup map (O(1) date lookup)
- No re-renders on parent updates (unless props change)
- Event indicators render efficiently

---

### 4. EventsList
**File:** `EventsList.tsx`

Sidebar component showing events for selected date.

**Props:**
```typescript
interface EventsListProps {
  events: CalendarEventDto[];
  selectedDate: Date | null;
  onEventClick: (event: CalendarEventDto) => void;
  loading: boolean;
}
```

**Features:**
- Shows full date label ("Monday, January 15, 2024")
- Lists all events for selected date
- Event count badge
- Each event shows:
  - Icon (video, file, bell, clock)
  - Title
  - Course name
  - Status badge (SCHEDULED, OVERDUE, PUBLISHED, etc.)
  - Time range
  - Description preview (2 lines)
- Hover effect on events
- Click to open event details modal
- Loading skeleton while fetching
- Empty state message

**Status Colors:**
- SCHEDULED: Blue
- LIVE: Red
- COMPLETED: Green
- CANCELLED: Gray
- OVERDUE: Red (darker)
- PUBLISHED: Green
- DRAFT: Yellow

**Responsive:**
- Full width on mobile
- Fixed width on desktop (1 column)
- Sidebar scrolls independently

---

### 5. EventDetailsModal
**File:** `EventDetailsModal.tsx`

Full-screen modal showing complete event information.

**Props:**
```typescript
interface EventDetailsModalProps {
  event: CalendarEventDto | null;
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**
- Dismissible (click backdrop or close button)
- Sticky header (stays visible while scrolling)
- Sticky footer (action buttons)
- Displays:
  - Event title with icon
  - Event type label
  - Course name (clickable in future)
  - Status badge
  - Full date/time range
  - Duration calculation
  - Event description
  - Additional metadata (max marks, zoom link, etc.)
  - Info banner with next steps

**Layout:**
- Header: Icon + Title + Type + Close button
- Content: Course, Status, Date/Time, Details, Metadata
- Footer: Close button

**Accessibility:**
- Focus trap (when open)
- Escape key closes modal
- Click backdrop closes modal
- High contrast text on dark background

**Responsive:**
- Max width 2xl (large screens)
- Fills viewport on small screens
- Max height 90vh (leaves margin on mobile)
- Scrollable content area

---

## Data Flow

### Event Fetching
```
CalendarPage (useEffect: month changes)
  ↓
fetch(/calendar?startDate=...&endDate=...&Authorization: Bearer token)
  ↓
Backend Calendar Service aggregates:
  - LiveSessions (startTime)
  - Assignments (dueDate)
  - Announcements (publishedAt)
  ↓
Response: CalendarEventsResponseDto
  ↓
setEvents([...])
  ↓
CalendarView renders grid with event dots
  ↓
User selects date
  ↓
EventsList filters events for selected date
  ↓
User clicks event
  ↓
EventDetailsModal opens with full details
```

### State Management
```
CalendarPage
├── currentDate: Date → DatePicker, CalendarView
├── selectedDate: Date | null → CalendarView, EventsList, EventDetailsModal
├── events: CalendarEventDto[] → CalendarView, EventsList
├── selectedEvent: CalendarEventDto | null → EventDetailsModal
├── loading: boolean → CalendarView, EventsList
└── error: string → Error message display
```

---

## Type Definitions

### CalendarEventDto
```typescript
interface CalendarEventDto {
  id: string;
  type: 'LIVE_CLASS' | 'ASSIGNMENT_DUE' | 'ANNOUNCEMENT' | 'QUIZ_ATTEMPT';
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
  date: string; // ISO 8601
  endDate?: string; // ISO 8601
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE' | 'PUBLISHED' | 'DRAFT';
  icon: 'video' | 'file' | 'bell' | 'clock';
  color: 'blue' | 'orange' | 'green' | 'purple' | 'red' | 'yellow';
  sourceId: string;
  sourceType: 'LiveSession' | 'Assignment' | 'Announcement' | 'Quiz';
  metadata?: {
    maxMarks?: number;
    zoomMeetingId?: string;
    instructorId?: string;
    [key: string]: any;
  };
}
```

### CalendarEventsResponse
```typescript
interface CalendarEventsResponse {
  events: CalendarEventDto[];
  range: {
    start: string;
    end: string;
  };
}
```

---

## Styling & Theme

### Colors Used
- Primary: `text-blue-500/600/700`
- Secondary: `text-neutral-400/500`
- Success: `text-green-400`
- Warning: `text-orange-400`
- Error: `text-red-400`
- Background: `bg-neutral-900/950`

### Layout Grid
- Calendar: `grid-cols-7` (7 days)
- Desktop layout: `lg:grid-cols-3` (2 cols calendar + 1 col sidebar)
- Mobile: `grid-cols-1` (stacked)

### Spacing & Sizing
- Gap: `gap-2` (calendar cells)
- Padding: `p-6` (containers), `p-4` (cards)
- Border radius: `rounded-lg` / `rounded-2xl`
- Aspect ratio: `aspect-square` (calendar cells)

---

## RBAC & Authorization

### Access Control Flow
```
User visits /dashboard/instructor/calendar
  ↓
layout.tsx checks token
  ↓
CalendarPage checks user role
  ↓
If role !== INSTRUCTOR && role !== ADMIN:
  → Redirect to /dashboard/student
  ↓
If authorized:
  → Fetch /calendar with Bearer token
  ↓
Backend verifies:
  - JWT valid
  - Role is INSTRUCTOR or ADMIN
  - (For INSTRUCTOR) Events filtered to own courses
  ↓
Return filtered events
  ↓
Display calendar
```

### Instructor View
- Sees events only from **own courses**
- Cannot access other instructors' events
- Can use `courseId` filter (but only for own courses)

### Admin View
- Sees events from **all courses**
- Can filter by specific course
- Full unrestricted access

---

## Performance Optimization

### Calendar Grid Rendering
```typescript
// Memoized event lookup for O(1) date access
const eventsByDate = useMemo(() => {
  const map = new Map<string, CalendarEventDto[]>();
  events.forEach((event) => {
    const dateKey = new Date(event.date).toISOString().split('T')[0];
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)!.push(event);
  });
  return map;
}, [events]);

// In render:
const dayEvents = eventsByDate.get(dateKey) || [];
```

### Lazy Loading
- EventDetailsModal content rendered only when open
- Modal doesn't mount until first open

### Re-render Prevention
- DatePicker: No child re-renders on month change
- CalendarView: Memoized grid prevents unnecessary updates
- EventsList: Only re-renders when selectedDate changes

---

## Error Handling

### User-Facing Errors
1. **Authorization Error (401):**
   - Message: "Unauthorized. Please log in again."
   - Action: Clear token, redirect to login

2. **Access Denied (403):**
   - Message: "Access denied."
   - Action: Show error banner, disable calendar

3. **Network Error:**
   - Message: "Failed to load calendar events"
   - Action: Show retry hint, allow retry

4. **Invalid Date Range:**
   - Message: "Invalid date format" (from backend)
   - Action: Fallback to current month

### Loading States
- While fetching: Show skeleton loaders
- Empty result: "No events on this date" message
- Error state: Red error banner with icon

---

## Accessibility Features

### Keyboard Navigation
- Tab: Move between interactive elements
- Enter: Activate buttons, select dates
- Escape: Close modal
- Arrow keys: Navigate month (future enhancement)

### Screen Readers
- ARIA labels on buttons
- Date format: "Monday, January 15, 2024"
- Event type indicators: "Video icon - Live Class"
- Status badges: Color + text (not color-only)

### Visual Accessibility
- High contrast colors (WCAG AA compliant)
- Font size: Minimum 14px for readability
- Focus indicators on all interactive elements
- Clear visual hierarchy

---

## Browser Compatibility

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Full support (iOS 14+)
- **Mobile:** Responsive design, touch-optimized

### Known Issues
- None currently identified

---

## Future Enhancements

1. **Week View** - Alternative calendar view
2. **Drag & Drop** - Move events between dates
3. **Inline Editing** - Edit event details from calendar
4. **Export** - Download as .ics or PDF
5. **Color Customization** - User-defined event colors
6. **Filtering** - Filter by event type, course, status
7. **Timezone Support** - Display in user's timezone
8. **Reminders** - Toast notifications for upcoming events
9. **Search** - Find events by title/course
10. **Mobile App** - Native mobile calendar

---

## Testing

### Unit Tests (Jest + React Testing Library)
- Calendar grid renders correctly
- Event indicators display
- Month navigation works
- Date selection works
- Event list filters by date
- Modal open/close functionality
- Loading states display
- Error states display
- RBAC enforced

### Integration Tests
- Full calendar workflow (navigate → select → view)
- API communication
- Error handling

### E2E Tests (Cypress - Future)
- User can view calendar
- User can navigate months
- User can select dates
- User can click events
- Modal displays full details
- User can close modal
- Instructor RBAC enforced
- Admin can see all events

---

## Troubleshooting

### Calendar Not Loading
**Check 1:** Is user logged in?
- Solution: Verify token in localStorage

**Check 2:** Is user authorized (INSTRUCTOR/ADMIN)?
- Solution: Check user role in browser console

**Check 3:** Are there events in the database?
- Solution: Verify data in backend dashboard

**Check 4:** Is API endpoint accessible?
- Solution: Test `http://localhost:4000/calendar` in postman

### Events Not Appearing
**Check 1:** Is the date range correct?
- Solution: Navigate to month where events exist

**Check 2:** Are events published/active?
- Solution: Check announcement status, assignment dueDate

**Check 3:** Is user enrolled in/own course?
- Solution: Verify course enrollment

### Modal Won't Close
- Solution: Click backdrop or close button (X)
- Fallback: Refresh page (F5)

---

## Support

For bugs, feature requests, or questions:
1. Check this documentation
2. Review browser console for errors
3. Contact StudentForge development team

---

## Version History

- **v1.0** (Jan 2024) - Initial release
  - Month-based calendar view
  - Event aggregation (Live Classes, Assignments, Announcements)
  - Event details modal
  - RBAC enforcement
  - Responsive design
