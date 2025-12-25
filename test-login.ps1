$body = @{
    email = 'customer@matters.com'
    password = 'customer123'
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri 'http://localhost:4000/api/session/login' -Method Post -Body $body -ContentType 'application/json'
$response | ConvertTo-Json -Depth 10
