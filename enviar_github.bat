@echo off
cd /d "%~dp0"
echo ========================================================
echo         Enviando projeto para o GitHub
echo ========================================================
echo.
echo 1. Adicionando arquivos modificados...
git add -A

echo 2. Criando commit...
git commit -m "Ajuste do modal de senha do coordenador e contagem de acolitos e coroinhas"

echo 3. Enviando para o repositorio remoto...
git push origin main

echo.
echo ========================================================
echo         Processo finalizado com sucesso!
echo ========================================================
pause
