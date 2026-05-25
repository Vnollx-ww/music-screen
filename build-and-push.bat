@echo off
setlocal enabledelayedexpansion

rem Usage:
rem   build-and-push.bat
rem   build-and-push.bat 4.1
rem   build-and-push.bat 4.1 root@175.24.167.4
rem   build-and-push.bat 4.1 --no-cache
rem   build-and-push.bat 4.1 --no-cache --latest
rem   build-and-push.bat 4.1 root@175.24.167.4 --ssh-port 22
rem
rem After pushing, this script always deploys through SSH:
rem   docker pull images
rem   docker rm -f old containers
rem   docker run new containers

set "REGISTRY_NAMESPACE=vnollx"
set "VERSION="
set "NO_CACHE="
set "PUSH_LATEST=0"
set "DEPLOY_TARGET=root@175.24.167.4"
if not "%MUSIC_SCREEN_DEPLOY_TARGET%"=="" set "DEPLOY_TARGET=%MUSIC_SCREEN_DEPLOY_TARGET%"
set "SSH_PORT=%MUSIC_SCREEN_SSH_PORT%"
if "%SSH_PORT%"=="" set "SSH_PORT=22"
set "SSH_EXE=C:\Windows\System32\OpenSSH\ssh.exe"

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--no-cache" goto set_no_cache
if /i "%~1"=="--latest" goto set_latest
if /i "%~1"=="--ssh-port" goto set_ssh_port
if "%VERSION%"=="" goto set_version
if "%DEPLOY_TARGET%"=="" goto set_deploy_target
echo Unknown argument: %~1
exit /b 1

:set_no_cache
set "NO_CACHE=--no-cache"
shift
goto parse_args

:set_latest
set "PUSH_LATEST=1"
shift
goto parse_args

:set_ssh_port
shift
if "%~1"=="" (
    echo Missing port after --ssh-port.
    exit /b 1
)
set "SSH_PORT=%~1"
shift
goto parse_args

:set_version
set "VERSION=%~1"
shift
goto parse_args

:set_deploy_target
set "DEPLOY_TARGET=%~1"
shift
goto parse_args

:args_done

if "%VERSION%"=="" (
    set /p "VERSION=Enter version to build and push, e.g. 4.1: "
)

if "%VERSION%"=="" (
    echo Version cannot be empty.
    exit /b 1
)

if "%DEPLOY_TARGET%"=="" (
    set /p "DEPLOY_TARGET=Enter SSH deploy target, e.g. root@111.230.105.54: "
)

if "%DEPLOY_TARGET%"=="" (
    echo SSH deploy target cannot be empty.
    exit /b 1
)

docker version >nul 2>nul
if errorlevel 1 (
    echo Docker is not available. Please start Docker Desktop and try again.
    exit /b 1
)

if not exist "%SSH_EXE%" (
    set "SSH_EXE=C:\Windows\System32\ssh.exe"
)

"%SSH_EXE%" -V >nul 2>nul
if errorlevel 1 (
    echo OpenSSH client is not available. Please install or enable ssh and try again.
    echo Tried: %SSH_EXE%
    exit /b 1
)

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

set "BACKEND_IMAGE=%REGISTRY_NAMESPACE%/music-screen-backend:%VERSION%"
set "FRONTEND_IMAGE=%REGISTRY_NAMESPACE%/music-screen-frontend:%VERSION%"
set "BACKEND_RUN_IMAGE=music-screen-backend"
set "FRONTEND_RUN_IMAGE=music-screen-frontend"
set "BACKEND_LATEST_IMAGE=%REGISTRY_NAMESPACE%/music-screen-backend:latest"
set "FRONTEND_LATEST_IMAGE=%REGISTRY_NAMESPACE%/music-screen-frontend:latest"

echo.
echo Registry namespace: %REGISTRY_NAMESPACE%
echo Version: %VERSION%
echo Backend image: %BACKEND_IMAGE%
echo Frontend image: %FRONTEND_IMAGE%
echo Deploy target: %DEPLOY_TARGET%
echo SSH port: %SSH_PORT%

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
echo ==^> Deploy on %DEPLOY_TARGET%
set "REMOTE_DEPLOY_COMMAND=set -e; docker pull %BACKEND_IMAGE%; docker pull %FRONTEND_IMAGE%; docker tag %BACKEND_IMAGE% %BACKEND_RUN_IMAGE%; docker tag %FRONTEND_IMAGE% %FRONTEND_RUN_IMAGE%; docker network inspect app-network >/dev/null 2>&1 || docker network create app-network; docker rm -f music-screen-backend music-screen-frontend 2>/dev/null || true; docker run -d --name music-screen-backend --restart unless-stopped --network app-network -p 6060:6060 %BACKEND_RUN_IMAGE%; docker run -d --name music-screen-frontend --restart unless-stopped --network app-network -p 5000:5000 %FRONTEND_RUN_IMAGE%; docker ps --filter name=music-screen --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'"
"%SSH_EXE%" -p "%SSH_PORT%" "%DEPLOY_TARGET%" "%REMOTE_DEPLOY_COMMAND%"
if errorlevel 1 exit /b 1

echo.
echo Done.
echo Pushed: %BACKEND_IMAGE%
echo Pushed: %FRONTEND_IMAGE%

if "%PUSH_LATEST%"=="1" (
    echo Pushed: %BACKEND_LATEST_IMAGE%
    echo Pushed: %FRONTEND_LATEST_IMAGE%
)

endlocal
