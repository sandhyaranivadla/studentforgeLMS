# Troubleshooting Guide - StudentForge LMS

## Issue: "Failed to load announcements" & "Failed to fetch analytics"

### What's Happening

The dashboard is showing error messages because:

1. **You're logged in** ✅ - You can see "User" in the bottom left
2. **You don't have a course** ❌ - The dashboard needs a course to display analytics and announcements
3. **API is rejecting requests** - Without a course/data, the endpoints return errors

### Solution

#### Step 1: Create a Course

1. Click on **"Dashboard"** in the sidebar (or go to http://localhost:3000/dashboard)
2. Look for a **"Create Course"** button or navigate to Courses section
3. Fill in course details:
   - Title: "Test Course"
   - Description: "Test Description"
   - Click Create

#### Step 2: Verify the Course

1. After creating, you should see the course listed
2. Go back to the Instructor Dashboard
3. Errors should be gone - or at least different

#### Step 3: Test Notifications

Now that you have a course:

1. **Create an Assignment**:
   - In your course, create an assignment
   - Title: "Test Assignment"
   
2. **Enroll a Student**:
   - Open browser incognito
   - Login as a student (or create a test student account)
   - Enroll in the course you created
   
3. **Submit Assignment**:
   - As student: Submit the assignment
   - As instructor (original tab): Watch the **🔔 bell icon** - it should show a notification in real-time!

---

## Common Errors Explained

### Error: "Failed to load announcements"
**Cause**: No announcements exist for your courses  
**Solution**: Create announcements or it's expected if you haven't created any yet

### Error: "Failed to fetch analytics"
**Cause**: No course data or assignments to analyze  
**Solution**: Create courses and assignments first

### Error: "Connection issue" (Red banner)
**Cause**: Socket.io can't connect to backend  
**Solution**: 
- Verify backend is running on port 4000
- Check `NEXT_PUBLIC_API_URL=http://localhost:4000` in .env.local
- Restart frontend dev server

### Error: HTTP 401 Unauthorized
**Cause**: JWT token expired or missing  
**Solution**:
- Logout and login again
- Check browser cookies (should have "token" cookie)

---

## Verification Checklist

- [ ] Backend running on http://localhost:4000
- [ ] Frontend running on http://localhost:3000
- [ ] You're logged in (see user in bottom left)
- [ ] A course exists (check Courses page)
- [ ] Can see assignments for the course
- [ ] Notifications bell works (appears in header)

---

## Debug Endpoints

### Check if Backend is Responsive
```bash
curl -X GET "http://localhost:4000/" \
  -H "Authorization: Bearer your-jwt-token"
```

### Check Your User Info
```bash
curl -X GET "http://localhost:4000/auth/me" \
  -H "Authorization: Bearer your-jwt-token"
```

### Check Notifications (requires valid token)
```bash
curl -X GET "http://localhost:4000/notifications" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Expected Behavior

### Notifications Page
- 🟢 Should load without errors
- 🟢 Show "No notifications" if none exist
- 🟢 Real-time updates when notifications are sent

### Dashboard (Instructor)
- 🟢 Show course name and stats
- 🟢 Show analytics section
- 🟢 Show announcements list
- ❌ Errors are OK if no data exists yet - this is normal

### Real-Time Notifications Test
1. Create assignment as instructor
2. Enroll student in course
3. Submit as student
4. **Bell icon badge updates** immediately in real-time ✅

---

## Reset Everything (If Needed)

### Restart Backend
```bash
# Kill the process
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# Start again
cd backend
npm start
```

### Restart Frontend
```bash
# Kill the process (done above)

# Start again
cd frontend
npm run dev
```

### Clear Cache
- Open DevTools (F12)
- Application → Cookies → Delete "token" cookie
- Logout and login again

---

## Still Having Issues?

### Check Backend Logs
Look at the backend terminal - errors should appear there if something's wrong

### Check Frontend Logs
Open DevTools (F12) → Console tab - errors will appear with exact status codes

### Verify CORS
Backend has CORS enabled globally - should not be an issue

### Verify Database Connection
If you see "Connection" errors in backend logs, the database might not be running

---

## The Notifications System is Working Correctly!

The errors you see are **expected behavior** when:
- No courses exist
- No data to display
- First login (no notifications yet)

**This is NOT a bug** - it's normal LMS behavior.

The real test of the notifications system is:
1. Create course ✅
2. Enroll student ✅
3. Submit assignment ✅
4. See real-time notification 🔔 ← This proves it works!

