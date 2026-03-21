@echo off
echo Starting DA40NG Weight ^& Balance Dashboard...
echo Opening http://localhost:8080
start http://localhost:8080
python -m http.server 8080 --directory "%~dp0"
