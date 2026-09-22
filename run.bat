@echo off
echo =====================================================================
echo  Rail Sentinel - Indian Railways Track Maintenance Block Planning
echo  Maharashtra Central Railway Pilot (Simulated Demo Dataset)
echo =====================================================================
echo.
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Rail Sentinel Backend" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 >nul

echo Starting Vite React Frontend on http://localhost:5173 ...
cd frontend
start "Rail Sentinel Frontend" cmd /k "npm run dev"

echo.
echo Both servers started!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo =====================================================================
pause
