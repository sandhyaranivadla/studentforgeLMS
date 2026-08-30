#!/bin/bash

courseId="b4c64f3f-84c3-4412-96fb-79d49dd70243"
token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpbnN0cnVjdG9yLTEyMyIsImVtYWlsIjoiaW5zdHJ1Y3RvckBzdHVkZW50Zm9yZ2UuY29tIiwicm9sZSI6IklOU1RSVUNUT1IiLCJpYXQiOjE3ODc3Mjg5ODAsImV4cCI6MTc4NzgxNTM4MH0.mZnOQpe-vtK1iPUz3zyJSRXuFmN3qJi52qSpTZnUYMQ"

echo "=== TESTING ALL 5 ENDPOINTS ==="
echo ""
echo "1. Assignments:"
curl -s "http://localhost:4000/assignments?courseId=$courseId" \
  -H "Authorization: Bearer $token" | jq '.[] | {id, title}' | head -20

echo ""
echo "2. Quizzes:"
curl -s "http://localhost:4000/quizzes?courseId=$courseId" \
  -H "Authorization: Bearer $token" | jq '.[] | {id, title}' | head -20

echo ""
echo "3. Live Sessions:"
curl -s "http://localhost:4000/live-sessions/course/$courseId" \
  -H "Authorization: Bearer $token" | jq '.[] | {id, title}' | head -20

echo ""
echo "4. Announcements:"
curl -s "http://localhost:4000/announcements?courseId=$courseId" \
  -H "Authorization: Bearer $token" | jq '.[] | {id, title}' | head -20

echo ""
echo "5. Analytics:"
curl -s "http://localhost:4000/analytics/courses/$courseId/overview" \
  -H "Authorization: Bearer $token" | jq '.'
