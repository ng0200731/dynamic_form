@echo off
setlocal
cd /d "%~dp0"

echo Starting Dynamic Page ^& Form Builder...
echo API:  http://127.0.0.1:3001
echo App:  http://127.0.0.1:4500

start "" "http://127.0.0.1:4500"
npm run dev
