# Calendar API Documentation

## Overview

The Calendar API provides a unified view of important events related to an instructor's courses. It aggregates events from multiple sources (Live Classes, Assignments, Announcements) into a single, normalized response.

## Base URL

```
http://localhost:4000/calendar
```

## Authentication

All endpoints require JWT authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Get Calendar Events (Date Range)

Get all calendar events within a specified date range.

**Endpoint:** `GET /calendar`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO 8601 DateTime | Yes | Start of date range (e.g., `2024-01-01T00:00:00Z`) |
| `endDate` | ISO 8601 DateTime | Yes | End of date range (e.g., `2024-01-31T23:59:59Z`) |
| `courseId` | String (UUID) | No | Filter to a specific course (optional) |

**Response:** `CalendarEventsResponseDto`

```json
{
  "events": [
    {
      "id": "event-uuid",
      "type": "LIVE_CLASS" | "ASSIGNMENT_DUE" | "ANNOUNCEMENT" | "QUIZ_ATTEMPT",
      "title": "Event Title",
      "description": "Event description",
      "courseId": "course-uuid",
      "courseName": "Course Title",
      "date": "2024-01-15T10:00:00Z",
      "endDate": "2024-01-15T11:00:00Z",
      "status": "SCHEDULED" | "COMPLETED" | "OVERDUE" | "PUBLISHED",
      "icon": "video" | "file" | "bell" | "clock",
      "color": "blue" | "orange" | "green" | "purple",
      "sourceId": "source-entity-id",
      "sourceType": "LiveSession" | "Assignment" | "Announcement",
      "metadata": {
        "maxMarks": 100,
        "zoomMeetingId": "zoom-123",
        "instructorId": "instructor-uuid"
      }
    }
  ],
  "range": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  }
}
```

**Status Codes:**

- `200 OK`: Success
- `400 Bad Request`: Invalid date format or date range
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User doesn't have access to the requested course (when `courseId` provided)

**Example Request:**

```bash
curl -X GET "http://localhost:4000/calendar?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Example Response:**

```json
{
  "events": [
    {
      "id": "announcement-1",
      "type": "ANNOUNCEMENT",
      "title": "Important Update",
      "courseId": "course-1",
      "courseName": "Introduction to Web Development",
      "date": "2024-01-10T08:00:00Z",
      "status": "PUBLISHED",
      "icon": "bell",
      "color": "green",
      "sourceId": "announcement-1",
      "sourceType": "Announcement"
    },
    {
      "id": "live-1",
      "type": "LIVE_CLASS",
      "title": "Live Class",
      "courseId": "course-1",
      "courseName": "Introduction to Web Development",
      "date": "2024-01-15T10:00:00Z",
      "endDate": "2024-01-15T11:00:00Z",
      "status": "SCHEDULED",
      "icon": "video",
      "color": "blue",
      "sourceId": "live-1",
      "sourceType": "LiveSession",
      "metadata": {
        "zoomMeetingId": "zoom-123"
      }
    },
    {
      "id": "assignment-1",
      "type": "ASSIGNMENT_DUE",
      "title": "Assignment 1 - Due",
      "courseId": "course-1",
      "courseName": "Introduction to Web Development",
      "date": "2024-01-20T23:59:59Z",
      "status": "SCHEDULED",
      "icon": "file",
      "color": "orange",
      "sourceId": "assignment-1",
      "sourceType": "Assignment",
      "metadata": {
        "maxMarks": 100
      }
    }
  ],
  "range": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  }
}
```

---

### 2. Get Calendar Events (Specific Date)

Get all calendar events for a specific date.

**Endpoint:** `GET /calendar/:date`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | ISO 8601 Date | Yes | Date to retrieve events for (e.g., `2024-01-15`) |

**Response:** Array of `CalendarEventDto`

```json
[
  {
    "id": "event-uuid",
    "type": "LIVE_CLASS",
    "title": "Morning Standup",
    "date": "2024-01-15T09:00:00Z",
    "endDate": "2024-01-15T09:30:00Z",
    ...
  },
  {
    "id": "event-uuid-2",
    "type": "ANNOUNCEMENT",
    "title": "New Assignment Posted",
    "date": "2024-01-15T14:00:00Z",
    ...
  }
]
```

**Status Codes:**

- `200 OK`: Success (returns array, may be empty)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User doesn't have access

**Example Request:**

```bash
curl -X GET "http://localhost:4000/calendar/2024-01-15" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## Event Types & Mapping

### LIVE_CLASS
- **Source:** `LiveSession` table
- **Date Field:** `startTime`
- **End Field:** `endTime`
- **Status Mapping:** Uses `LiveSession.status` (SCHEDULED, LIVE, COMPLETED, CANCELLED)
- **Icon:** `video` | **Color:** `blue`

### ASSIGNMENT_DUE
- **Source:** `Assignment` table (with `dueDate`)
- **Date Field:** `dueDate`
- **Status Logic:** If `dueDate < now` → `OVERDUE`, else `SCHEDULED`
- **Icon:** `file` | **Color:** `orange`
- **Metadata:** `maxMarks`

### ANNOUNCEMENT
- **Source:** `Announcement` table (status = PUBLISHED)
- **Date Field:** `publishedAt`
- **Status:** Always `PUBLISHED`
- **Icon:** `bell` | **Color:** `green`
- **Metadata:** `instructorId`

### QUIZ_ATTEMPT (Future)
- Reserved for quiz attempts/deadlines (not currently implemented)

---

## RBAC & Access Control

### Instructor
- Can view calendar events **only** from courses they own
- Query automatically filtered by course ownership
- If `courseId` parameter provided and course not owned → `403 Forbidden`

### Admin
- Can view calendar events from **all** courses
- No course ownership filter applied
- Can use `courseId` parameter to filter to specific courses

### Student
- **Not supported** in this version
- Calendar is instructor/admin only

---

## Date & Time Handling

### Format
- All dates: ISO 8601 format (e.g., `2024-01-15T10:30:00Z`)
- Timezone: UTC (Z suffix indicates UTC)

### Browser Display
- Frontend converts UTC dates to browser's local timezone using `toLocaleString()`
- Example: Server sends `2024-01-15T10:30:00Z` (UTC)
- User in EST sees: `1/15/2024, 5:30 AM EST`

### Validation
- Dates must be valid ISO 8601 format
- `endDate` must be after `startDate`
- Invalid dates → `400 Bad Request`

---

## Performance Considerations

### Indexing
The Calendar Service uses existing database indexes for efficient queries:
- `LiveSession.startTime` (indexed)
- `Assignment.dueDate` (indexed)
- `Announcement.publishedAt` (indexed)
- `Course.instructorId` (indexed for RBAC filtering)

### Optimization Tips
- Use narrow date ranges when possible (avoid full-year queries)
- Filter by `courseId` if targeting specific course
- Results are pre-sorted by date (no client-side sorting needed)

### Query Plan
1. Fetch courses for user (1 query, filtered by instructorId)
2. Fetch live sessions within date range (1 query, indexed)
3. Fetch assignments with due dates (1 query, indexed)
4. Fetch published announcements (1 query, indexed)
5. Normalize & merge results
6. Sort by date
7. Return to client

**Total queries:** 4 database queries per request (optimized with indexes)

---

## Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)",
  "error": "Bad Request"
}
```

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**403 Forbidden**
```json
{
  "statusCode": 403,
  "message": "You do not have access to this course",
  "error": "Forbidden"
}
```

---

## Testing

### Unit Tests
- 20+ unit tests covering service logic
- Tests include RBAC, date range queries, event normalization
- Run: `npm run test -- --testNamePattern="CalendarService"`

### Integration Tests
- Test calendar endpoint with real database (when available)
- Test RBAC enforcement
- Test event aggregation accuracy

### Manual Testing

**Test 1: Instructor views own courses**
```bash
curl -X GET "http://localhost:4000/calendar?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer <instructor_token>"
# Expected: Events from instructor's courses only
```

**Test 2: Admin views all courses**
```bash
curl -X GET "http://localhost:4000/calendar?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer <admin_token>"
# Expected: Events from all courses
```

**Test 3: Unauthorized access denied**
```bash
curl -X GET "http://localhost:4000/calendar?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer <invalid_token>"
# Expected: 401 Unauthorized
```

---

## Future Enhancements

1. **Quiz Deadlines** - Add QUIZ_ATTEMPT event type with quiz due dates
2. **Timezone Support** - Store user timezone preference, convert on server
3. **Calendar Export** - Export to .ics (iCalendar) format
4. **Reminders** - Integrate with notification system for event reminders
5. **Recurring Events** - Support repeating events (e.g., weekly live classes)
6. **Color Customization** - Allow instructors to customize event colors
7. **Calendar Sync** - Google Calendar, Outlook integration
8. **Filtering** - Advanced filtering by event type, course, status
9. **Week View** - Alternative calendar view (currently month-only)

---

## Support & Troubleshooting

### Issue: Events not appearing
- **Check 1:** Verify date range is correct (use current month)
- **Check 2:** Verify user is enrolled/owns courses with events
- **Check 3:** Check event status (announcements must be PUBLISHED)
- **Check 4:** Verify JWT token is valid and not expired

### Issue: 403 Forbidden error
- **Check 1:** Verify instructor owns the course
- **Check 2:** Verify user role is INSTRUCTOR or ADMIN
- **Check 3:** Check if courseId parameter is set to wrong course

### Issue: Date parsing error
- **Check 1:** Use ISO 8601 format (e.g., `2024-01-15T10:00:00Z`)
- **Check 2:** Ensure endDate is after startDate
- **Check 3:** Use URL-encoded dates in query strings

---

## Version History

- **v1.0** (Jan 2024) - Initial release with LiveSession, Assignment, Announcement aggregation

---

## Contact & Support

For issues, questions, or feature requests, contact the StudentForge development team.
