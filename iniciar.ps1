Set-Location "c:\Users\Barudi64g\Documents\Sagrada Familia"
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1
$p = Start-Process python -ArgumentList "-m http.server 8080" -PassThru -WindowStyle Minimized
Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:8080"
Write-Output "Servidor iniciado com PID $($p.Id) em http://127.0.0.1:8080"
