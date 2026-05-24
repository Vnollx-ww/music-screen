@echo off
setlocal enabledelayedexpansion

rem Usage:
rem   build-and-push.bat
rem   build-and-push.bat 4.1
rem   build-and-push.bat 4.1 --no-cache
rem   build-and-push.bat 4.1 --no-cache --latest
rem
rem After pushing, pull and run on server:
rem   docker pull vnollx/music-screen-backend:4.1
rem   docker pull vnollx/music-screen-frontend:4.1
rem   docker stop music-screen-backend music-screen-frontend
rem   docker rm music-screen-backend music-screen-frontend
rem   docker run -d --name music-screen-backend --restart unless-stopped -p 6060:6060 vnollx/music-screen-backend:4.1
rem   docker run -d --name music-screen-frontend --restart unless-stopped -p 5000:5000 vnollx/music-screen-frontend:4.1

set "REGISTRY_NAMESPACE=vnollx"
set "VERSION=%~1"
set "NO_CACHE="
set "PUSH_LATEST=0"

if "%VERSION%"=="--no-cache" set "VERSION="
if "%VERSION%"=="--latest" set "VERSION="

if "%VERSION%"=="" (
    set /p "VERSION=请输入要构建并推送的版本号，例如 4.1: "
)

if "%VERSION%"=="" (
    echo Version cannot be empty.
    exit /b 1
)

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--no-cache" set "NO_CACHE=--no-cache"
if /i "%~1"=="--latest" set "PUSH_LATEST=1"
shift
goto parse_args
:args_done

docker version >nul 2>nul
if errorlevel 1 (
    echo Docker is not available. Please start Docker Desktop and try again.
    exit /b 1
)

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

set "BACKEND_IMAGE=%REGISTRY_NAMESPACE%/music-screen-backend:%VERSION%"
set "FRONTEND_IMAGE=%REGISTRY_NAMESPACE%/music-screen-frontend:%VERSION%"
set "BACKEND_LATEST_IMAGE=%REGISTRY_NAMESPACE%/music-screen-backend:latest"
set "FRONTEND_LATEST_IMAGE=%REGISTRY_NAMESPACE%/music-screen-frontend:latest"

echo.
echo Registry namespace: %REGISTRY_NAMESPACE%
echo Version: %VERSION%
echo Backend image: %BACKEND_IMAGE%
echo Frontend image: %FRONTEND_IMAGE%

echo.
echo ==^> Build backend image
docker build %NO_CACHE% -t "%BACKEND_IMAGE%" "%BACKEND_DIR%"
if errorlevel 1 exit /b 1

echo.
echo ==^> Build frontend image
docker build %NO_CACHE% -t "%FRONTEND_IMAGE%" "%FRONTEND_DIR%"
if errorlevel 1 exit /b 1

if "%PUSH_LATEST%"=="1" (
    echo.
    echo ==^> Tag latest images
    docker tag "%BACKEND_IMAGE%" "%BACKEND_LATEST_IMAGE%"
    if errorlevel 1 exit /b 1
    docker tag "%FRONTEND_IMAGE%" "%FRONTEND_LATEST_IMAGE%"
    if errorlevel 1 exit /b 1
)

echo.
echo ==^> Push backend image
docker push "%BACKEND_IMAGE%"
if errorlevel 1 exit /b 1

echo.
echo ==^> Push frontend image
docker push "%FRONTEND_IMAGE%"
if errorlevel 1 exit /b 1

if "%PUSH_LATEST%"=="1" (
    echo.
    echo ==^> Push latest images
    docker push "%BACKEND_LATEST_IMAGE%"
    if errorlevel 1 exit /b 1
    docker push "%FRONTEND_LATEST_IMAGE%"
    if errorlevel 1 exit /b 1
)

echo.
echo Done.
echo Pushed: %BACKEND_IMAGE%
echo Pushed: %FRONTEND_IMAGE%

if "%PUSH_LATEST%"=="1" (
    echo Pushed: %BACKEND_LATEST_IMAGE%
    echo Pushed: %FRONTEND_LATEST_IMAGE%
)

endlocal
