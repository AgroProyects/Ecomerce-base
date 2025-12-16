# Rate Limit Test Script
# Run with: .\test-rate-limit.ps1

Write-Host "=== RATE LIMIT TEST ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# ----------------------------
# Server check
# ----------------------------
Write-Host "Checking server..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method OPTIONS -TimeoutSec 5 -ErrorAction Stop

    Write-Host "Server running at $baseUrl" -ForegroundColor Green
}
catch {
    Write-Host "Server NOT running at $baseUrl" -ForegroundColor Red
    Write-Host "Run: npm run dev" -ForegroundColor Yellow
    exit 1
}

# ----------------------------
# TEST 1 - REGISTER
# ----------------------------
Write-Host ""
Write-Host "TEST 1: Register (5 req / 10s)" -ForegroundColor Cyan

for ($i = 1; $i -le 7; $i++) {
    try {
        $body = @{
            email    = "test$i@test.com"
            password = "123456"
            name     = "Test $i"
        } | ConvertTo-Json

        $res = Invoke-WebRequest `
            -Uri "$baseUrl/api/auth/register" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop

        Write-Host "[$i] Status $($res.StatusCode)" -ForegroundColor Green
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 429) {
            Write-Host "[$i] 429 RATE LIMITED (expected)" -ForegroundColor Yellow
        }
        else {
            Write-Host "[$i] Status $status" -ForegroundColor Red
        }
    }

    Start-Sleep -Milliseconds 800
}

# ----------------------------
# TEST 2 - COUPON
# ----------------------------
Write-Host ""
Write-Host "TEST 2: Coupon (10 req / 60s)" -ForegroundColor Cyan

for ($i = 1; $i -le 12; $i++) {
    try {
        $body = @{
            code     = "TEST10"
            email    = "test@test.com"
            subtotal = 1000
        } | ConvertTo-Json

        $res = Invoke-WebRequest `
            -Uri "$baseUrl/api/coupons/validate" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop

        Write-Host "[$i] Status $($res.StatusCode)" -ForegroundColor Green
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 429) {
            Write-Host "[$i] 429 RATE LIMITED (expected)" -ForegroundColor Yellow
        }
        else {
            Write-Host "[$i] Status $status" -ForegroundColor Cyan
        }
    }

    Start-Sleep -Milliseconds 500
}

# ----------------------------
# TEST 3 - EMAIL
# ----------------------------
Write-Host ""
Write-Host "TEST 3: Email (2 req / 60s)" -ForegroundColor Cyan

for ($i = 1; $i -le 4; $i++) {
    try {
        $body = @{
            to      = "test@test.com"
            subject = "Test $i"
            message = "Test message $i"
        } | ConvertTo-Json

        $res = Invoke-WebRequest `
            -Uri "$baseUrl/api/email/send-test" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop

        Write-Host "[$i] Status $($res.StatusCode)" -ForegroundColor Green
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 429) {
            Write-Host "[$i] 429 RATE LIMITED (expected)" -ForegroundColor Yellow
        }
        else {
            Write-Host "[$i] Status $status" -ForegroundColor Cyan
        }
    }

    Start-Sleep -Milliseconds 500
}

# ----------------------------
# SUMMARY
# ----------------------------
Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Register -> 429 after 5" -ForegroundColor White
Write-Host "Coupon   -> 429 after 10" -ForegroundColor White
Write-Host "Email    -> 429 after 2" -ForegroundColor White
