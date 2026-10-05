@echo off
cd /d "%~dp0"
echo --- GIT ADD --- > git_output.txt
git add -A >> git_output.txt 2>&1
echo --- GIT COMMIT --- >> git_output.txt
git commit -m "Ajuste do modal de senha do coordenador e contagem de acolitos e coroinhas" >> git_output.txt 2>&1
echo --- GIT PUSH --- >> git_output.txt
git push origin main >> git_output.txt 2>&1
echo --- FIM --- >> git_output.txt
