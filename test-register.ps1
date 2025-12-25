$body = @{
    email = 'batham.tushar2001@gmail.com'
    password = 'yourpassword'
    name = 'Tushar Batham'
    role = 'user'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:4000/api/session/register' -Method Post -Body $body -ContentType 'application/json'
    Write-Host "Registration Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 2
} catch {
    Write-Host "Error:" -ForegroundColor Red
    $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        $_.ErrorDetails.Message
    }
}
