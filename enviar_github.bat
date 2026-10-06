@echo off
cd /d "%~dp0"
echo.
echo === ENVIANDO PARA O GITHUB ===
echo.
git add -A
git status
echo.
git commit -m "Mobile: cabecalho de datas fixo e nomes fixos na tabela"
echo.
git push origin main
echo.
echo === CONCLUIDO ===
pause
