$courseId = "b4c64f3f-84c3-4412-96fb-79d49dd70243"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpbnN0cnVjdG9yLTEyMyIsImVtYWlsIjoiaW5zdHJ1Y3RvckBzdHVkZW50Zm9yZ2UuY29tIiwicm9sZSI6IklOU1RSVUNUT1IiLCJpYXQiOjE3ODc3Mjg5ODAsImV4cCI6MTc4NzgxNTM4MH0.mZnOQpe-vtK1iPUz3zyJSRXuFmN3qJi52qSpTZnUYMQ"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "Testing all 5 endpoints with instructor token..."
Write-Host "Token for instructor-123 (valid until 12:51 PM UTC)"
Write-Host ""

# Test 1: Assignments
Write-Host "1. GET /assignments?courseId=$courseId"
$response = curl.exe -s -X GET "http://localhost:4000/assignments?courseId=$courseId" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json"
$parsed = $response | ConvertFrom-Json
Write-Host "   Status: $(if ($parsed.error) { '❌ ' + $parsed.statusCode } else { '✅ 200' })"
Write-Host "   Count: $($parsed.length ?? 'N/A')"
Write-Host ""

# Test 2: Quizzes
Write-Host "2. GET /quizzes?courseId=$courseId"
$response = curl.exe -s -X GET "http://localhost:4000/quizzes?courseId=$courseId" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json"
$parsed = $response | ConvertFrom-Json
Write-Host "   Status: $(if ($parsed.error) { '❌ ' + $parsed.statusCode } else { '✅ 200' })"
Write-Host "   Count: $($parsed.length ?? 'N/A')"
Write-Host ""

# Test 3: Live Sessions
Write-Host "3. GET /live-sessions/course/$courseId"
$response = curl.exe -s -X GET "http://localhost:4000/live-sessions/course/$courseId" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json"
$parsed = $response | ConvertFrom-Json
Write-Host "   Status: $(if ($parsed.error) { '❌ ' + $parsed.statusCode } else { '✅ 200' })"
Write-Host "   Count: $($parsed.length ?? 'N/A')"
Write-Host ""

# Test 4: Announcements
Write-Host "4. GET /announcements?courseId=$courseId"
$response = curl.exe -s -X GET "http://localhost:4000/announcements?courseId=$courseId" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json"
$parsed = $response | ConvertFrom-Json
Write-Host "   Status: $(if ($parsed.error) { '❌ ' + $parsed.statusCode } else { '✅ 200' })"
Write-Host "   Count: $($parsed.length ?? 'N/A')"
Write-Host ""

# Test 5: Analytics
Write-Host "5. GET /analytics/courses/$courseId/overview"
$response = curl.exe -s -X GET "http://localhost:4000/analytics/courses/$courseId/overview" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json"
$parsed = $response | ConvertFrom-Json
Write-Host "   Status: $(if ($parsed.error) { '❌ ' + $parsed.statusCode } else { '✅ 200' })"
Write-Host "   Data: $($parsed.courseTitle ?? 'N/A')"
