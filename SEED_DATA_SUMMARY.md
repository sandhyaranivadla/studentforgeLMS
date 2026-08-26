# StudentForge LMS - Seed Data Summary

## ✅ Database Successfully Seeded

All instructor features and course data have been restored to the database after the schema reset.

---

## Users Created

| Email | Role | Name | ID |
|-------|------|------|-----|
| admin@studentforge.com | ADMIN | Admin User | admin-123 |
| instructor@studentforge.com | INSTRUCTOR | John Instructor | instructor-123 |
| student1@studentforge.com | STUDENT | Alice Student | student1-123 |
| student2@studentforge.com | STUDENT | Bob Student | student2-123 |

---

## Course Structure

### Course: Introduction to Web Development
- **ID**: course-123
- **Instructor**: John Instructor
- **Price**: $49.99
- **Status**: Published ✅
- **Description**: Learn the basics of web development with HTML, CSS, and JavaScript

### Modules (3 total)

#### Module 1: HTML Fundamentals
- Lesson 1: HTML Basics (VIDEO - 30 min)
- Lesson 2: HTML Forms (PDF - 20 min)

#### Module 2: CSS Styling
- Lesson 3: CSS Selectors (VIDEO - 45 min)
- Lesson 4: Responsive Design (VIDEO - 50 min)

#### Module 3: JavaScript Basics
- (Ready for lessons)

---

## Instructor Features - FULLY RESTORED ✅

### Assignments Created (3 total)

#### Assignment 1: Build a Simple HTML Page
- **Module**: Module 1: HTML Fundamentals
- **Max Marks**: 100
- **Due Date**: 7 days from now
- **Status**: Active
- **Submissions**:
  - Alice Student: 90/100 ✅ (Graded with feedback: "Great work!")
  - Bob Student: 75/100 ✅ (Graded with feedback: "Good structure, but missing some semantic elements.")

#### Assignment 2: CSS Styling Challenge
- **Module**: Module 2: CSS Styling
- **Max Marks**: 150
- **Due Date**: 14 days from now
- **Status**: Active
- **Submissions**:
  - Alice Student: Submitted (pending review)

#### Assignment 3: JavaScript Calculator
- **Module**: Module 3: JavaScript Basics
- **Max Marks**: 200
- **Due Date**: 21 days from now
- **Status**: Active

### Quizzes Created (2 total)

#### Quiz 1: HTML Fundamentals Quiz
- **Module**: Module 1
- **Time Limit**: 30 minutes
- **Passing Score**: 60%
- **Questions**: 2
  - Q1: "What does HTML stand for?" (1 mark)
  - Q2: "Which tag is used for the largest heading?" (1 mark)
- **Student Attempts**:
  - Alice Student: 2/2 ✅ PASSED
  - Bob Student: 1/2 ❌ FAILED

#### Quiz 2: CSS Styling Quiz
- **Module**: Module 2
- **Time Limit**: 45 minutes
- **Passing Score**: 70%
- **Questions**: Ready for questions
- **Status**: Published

### Live Sessions (2 scheduled)

#### Session 1: HTML Basics Live Q&A
- **Scheduled**: 3 days from now
- **Duration**: 1 hour
- **Module**: Module 1: HTML Fundamentals
- **Zoom Link**: https://zoom.us/j/123456789

#### Session 2: CSS Advanced Techniques
- **Scheduled**: 7 days from now
- **Duration**: 90 minutes
- **Module**: Module 2: CSS Styling
- **Zoom Link**: https://zoom.us/j/987654321

### Announcements (2 published)

1. **Welcome to Web Development!**
   - Published 7 days ago
   - Status: Published ✅

2. **Assignment 1 Grading Complete**
   - Published 2 days ago
   - Status: Published ✅

---

## Student Data - RESTORED ✅

### Enrollments (2 total)

| Student | Course | Progress | Status |
|---------|--------|----------|--------|
| Alice Student | Intro to Web Dev | 60% | ACTIVE |
| Bob Student | Intro to Web Dev | 40% | ACTIVE |

### Lesson Progress

| Student | Lesson | Completed | Date |
|---------|--------|-----------|------|
| Alice Student | HTML Basics | ✅ | 3 days ago |
| Alice Student | HTML Forms | ✅ | 2 days ago |
| Bob Student | HTML Basics | ✅ | 4 days ago |

---

## Notifications (5 total)

| Recipient | Type | Status |
|-----------|------|--------|
| Alice Student | Enrollment Confirmed | Unread |
| Alice Student | Assignment Created | Unread |
| Bob Student | Assignment Graded | Read ✅ |
| Alice Student | Live Session Scheduled | Unread |
| Bob Student | Announcement Published | Unread |

---

## Course Messages (3 total)

1. **Instructor**: "Welcome to the course discussion! Please introduce yourself."
2. **Alice Student**: "Hi everyone! I'm excited to learn web development."
3. **Bob Student**: "Great! Looking forward to working with everyone."

---

## Database Statistics

- **Total Users**: 4
- **Total Courses**: 1
- **Total Modules**: 3
- **Total Lessons**: 4
- **Total Assignments**: 3
- **Total Submissions**: 3
- **Total Quizzes**: 2
- **Total Quiz Questions**: 2
- **Total Quiz Attempts**: 2
- **Total Enrollments**: 2
- **Total Lesson Progress**: 3
- **Total Announcements**: 2
- **Total Live Sessions**: 2
- **Total Notifications**: 5
- **Total Messages**: 3

---

## How to Access

### Test Credentials

**Instructor Login:**
- Email: `instructor@studentforge.com`
- Password: (Use your authentication system)

**Student Logins:**
- Email: `student1@studentforge.com` or `student2@studentforge.com`
- Password: (Use your authentication system)

### API Endpoints

Get all assignments:
```
GET http://localhost:4000/assignments
```

Get assignment submissions:
```
GET http://localhost:4000/assignments/{assignmentId}/submissions
```

Get quizzes:
```
GET http://localhost:4000/quizzes
```

Get live sessions:
```
GET http://localhost:4000/live-sessions/course/{courseId}
```

Get announcements:
```
GET http://localhost:4000/announcements
```

Get enrollments:
```
GET http://localhost:4000/enrollments
```

---

## Notes

✅ All instructor features are fully functional and tested  
✅ Database schema is synced with Prisma models  
✅ Backend is running and connected to CockroachDB  
✅ All relationships and constraints are properly defined  
✅ Seed data includes realistic scenarios with graded assignments  

---

**Generated**: August 26, 2026  
**Database**: CockroachDB (Cloud)  
**Status**: Ready for development and testing
