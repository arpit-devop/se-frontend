@echo off
echo ========================================
echo Fixing and Starting Dev Server
echo ========================================
echo.

echo Step 1: Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing webpack cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo Cache cleared!
) else (
    echo No cache to clear.
)

echo Step 3: Verifying packages are installed...
call npm list sonner lucide-react recharts --depth=0 >nul 2>&1
if %errorlevel% equ 0 (
    echo Packages verified!
) else (
    echo Installing missing packages...
    call npm install --legacy-peer-deps
)

echo.
echo Step 4: Starting dev server...
echo Please wait for the server to start...
echo.
call npm start

