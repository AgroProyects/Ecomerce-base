# Script para ejecutar tests de Rate Limiting
# Este script verifica el servidor y ejecuta los tests

Write-Host "=== PREPARANDO TESTS DE RATE LIMITING ===" -ForegroundColor Cyan
Write-Host ""

# Verificar si el servidor está corriendo
$serverRunning = $false
try {
    $null = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    $serverRunning = $true
    Write-Host "✓ Servidor detectado en http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "✗ Servidor no detectado en http://localhost:3000" -ForegroundColor Red
}

if (-not $serverRunning) {
    Write-Host ""
    Write-Host "Por favor, inicia el servidor en otra terminal:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Presiona Enter cuando el servidor esté listo..." -ForegroundColor Yellow
    Read-Host

    # Verificar nuevamente
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✓ Servidor detectado!" -ForegroundColor Green
    } catch {
        Write-Host "✗ No se puede conectar al servidor. Abortando." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Iniciando tests en 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Ejecutar el script de tests
& ".\test-rate-limit.ps1"
