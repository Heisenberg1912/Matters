# Update Frontend Environment Variables

param(
    [Parameter(Mandatory=$true)]
    [string]$BackendURL
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Frontend Configuration" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Backend URL: $BackendURL" -ForegroundColor Green
Write-Host ""

Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Select project: matterz" -ForegroundColor White
Write-Host "3. Go to: Settings → Environment Variables" -ForegroundColor White
Write-Host "4. Add these variables for PRODUCTION:" -ForegroundColor White
Write-Host ""
Write-Host "   VITE_API_URL = $BackendURL" -ForegroundColor Cyan
Write-Host "   VITE_API_BASE_URL = /api" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. After adding variables, redeploy:" -ForegroundColor White
Write-Host "   cd client" -ForegroundColor Gray
Write-Host "   vercel --prod --yes" -ForegroundColor Gray
Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
