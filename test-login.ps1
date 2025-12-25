$body = @{
    email = 'customer@matters.com'
    password = 'customer123'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:4000/api/session/login' -Method Post -Body $body -ContentType 'application/json'
    Write-Host "Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 2
} catch {
    Write-Host "Error:" -ForegroundColor Red
    $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        $_.ErrorDetails.Message
    }
}
