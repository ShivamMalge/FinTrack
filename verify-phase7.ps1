# RBAC + IDOR verification script for Phase 7 Docker gate
$ErrorActionPreference = "Continue"

Write-Host "=== PHASE 7 VERIFICATION ==="
Write-Host ""

# 1. Login as regular user
Write-Host "--- Step 1: Login as regular USER ---"
$loginResp = Invoke-WebRequest -Uri "http://localhost:4001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"user@example.com","password":"password123"}' -SessionVariable userSession -UseBasicParsing
Write-Host "Login response: $($loginResp.Content)"
Write-Host ""

# 2. RBAC gate: USER tries to create a category -> expect 403
Write-Host "--- Step 2: RBAC CHECK - USER tries POST /api/categories ---"
try {
    $rbac = Invoke-WebRequest -Uri "http://localhost:4001/api/categories" -Method POST -ContentType "application/json" -Body '{"name":"HackerCat","type":"INCOME"}' -WebSession $userSession -UseBasicParsing
    Write-Host "RBAC FAIL: Got status $($rbac.StatusCode) - should have been 403"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $body = $_.ErrorDetails.Message
    Write-Host "RBAC PASS: Got status $status"
    Write-Host "Body: $body"
}
Write-Host ""

# 3. Login as admin, create a transaction as admin
Write-Host "--- Step 3: Login as ADMIN ---"
$adminLogin = Invoke-WebRequest -Uri "http://localhost:4001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@example.com","password":"password123"}' -SessionVariable adminSession -UseBasicParsing
Write-Host "Admin login: $($adminLogin.Content)"
Write-Host ""

# Get categories to find a valid INCOME categoryId
$cats = Invoke-WebRequest -Uri "http://localhost:4001/api/categories" -WebSession $adminSession -UseBasicParsing
$catData = $cats.Content | ConvertFrom-Json
$incomeCat = $catData.data | Where-Object { $_.type -eq "INCOME" } | Select-Object -First 1
$catId = $incomeCat.id
Write-Host "Using INCOME category: $($incomeCat.name) (ID: $catId)"

# Create a transaction as admin
Write-Host "--- Step 4: Admin creates a transaction ---"
$txBody = @{amount=100; type="INCOME"; date="2026-01-01T00:00:00Z"; categoryId=$catId; note="Admin TX"} | ConvertTo-Json
try {
    $txResp = Invoke-WebRequest -Uri "http://localhost:4001/api/transactions" -Method POST -ContentType "application/json" -Body $txBody -WebSession $adminSession -UseBasicParsing
    $txData = $txResp.Content | ConvertFrom-Json
    $txId = $txData.data.id
    Write-Host "Created transaction ID: $txId"
} catch {
    Write-Host "TX creation failed: $($_.ErrorDetails.Message)"
    exit 1
}
Write-Host ""

# 4. IDOR gate: USER tries to access admin's transaction -> expect 404
Write-Host "--- Step 5: IDOR CHECK - USER tries GET /api/transactions/$txId ---"
try {
    $idor = Invoke-WebRequest -Uri "http://localhost:4001/api/transactions/$txId" -WebSession $userSession -UseBasicParsing
    Write-Host "IDOR FAIL: Got status $($idor.StatusCode) - should have been 404"
    Write-Host "Body: $($idor.Content)"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $body = $_.ErrorDetails.Message
    Write-Host "IDOR PASS: Got status $status"
    Write-Host "Body: $body"
}
Write-Host ""

# 5. IDOR gate: USER tries to DELETE admin's transaction -> expect 404
Write-Host "--- Step 6: IDOR CHECK - USER tries DELETE /api/transactions/$txId ---"
try {
    $idor2 = Invoke-WebRequest -Uri "http://localhost:4001/api/transactions/$txId" -Method DELETE -WebSession $userSession -UseBasicParsing
    Write-Host "IDOR FAIL: Got status $($idor2.StatusCode) - should have been 404"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $body = $_.ErrorDetails.Message
    Write-Host "IDOR PASS: Got status $status"
    Write-Host "Body: $body"
}
Write-Host ""

# 6. Frontend loads
Write-Host "--- Step 7: Frontend health check ---"
try {
    $fe = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing
    Write-Host "Frontend status: $($fe.StatusCode)"
} catch {
    Write-Host "Frontend FAIL: $_"
}

Write-Host ""
Write-Host "=== VERIFICATION COMPLETE ==="
