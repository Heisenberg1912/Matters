# Deploy Backend to Vercel

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Deploying Backend to Vercel" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "d:\matters\server"

Write-Host "Starting deployment..." -ForegroundColor Yellow
vercel --prod --yes

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "Backend deployed successfully!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Copy the deployment URL above" -ForegroundColor White
Write-Host "2. Go to https://vercel.com/dashboard" -ForegroundColor White
Write-Host "3. Select your backend project" -ForegroundColor White
Write-Host "4. Settings → Environment Variables" -ForegroundColor White
Write-Host "5. Add all variables from server/.env.production" -ForegroundColor White
Write-Host "6. Redeploy (vercel --prod --yes)" -ForegroundColor White
Write-Host ""
