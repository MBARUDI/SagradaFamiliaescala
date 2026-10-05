@echo off
cd /d "%~dp0"
echo ===================================================
echo     Iniciando Sistema Sagrada Familia
echo ===================================================
echo.
echo 1. Fechando instancias antigas...
taskkill /F /IM python.exe 2>nul
timeout /t 1 /nobreak >nul

echo 2. Abrindo o servidor em segundo plano...
start "Servidor Sagrada Familia - NAO FECHE ESTA JANELA" python -m http.server 8080

echo 3. Aguardando servidor iniciar...
timeout /t 2 /nobreak >nul

echo 4. Abrindo o sistema no navegador...
start http://localhost:8080

echo.
echo Tudo pronto! O sistema foi aberto no seu navegador.
echo Se a janela do navegador nao abrir, acesse: http://localhost:8080
timeout /t 3 /nobreak >nul
