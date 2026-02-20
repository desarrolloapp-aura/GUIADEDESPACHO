@echo off
setlocal
echo Iniciando Sistema de Impresion...

:: Definir posibles rutas de la carpeta de release
set "REL_PATH=release-packager\ImpresoraApp_PARA_COMPARTIR"
set "FULL_PATH_OUTSIDE=%~dp0impresora\%REL_PATH%"
set "FULL_PATH_INSIDE=%~dp0%REL_PATH%"

:: 1. Probar si estamos DENTRO de la carpeta 'impresora'
if exist "%FULL_PATH_INSIDE%" (
    echo Detectado: Ejecucion desde dentro de la carpeta del proyecto.
    cd /d "%FULL_PATH_INSIDE%"
    start "" "Impresora Guia Despacho.exe"
    exit
)

:: 2. Probar si estamos AFUERA (en el escritorio)
if exist "%FULL_PATH_OUTSIDE%" (
    echo Detectado: Ejecucion desde el Escritorio.
    cd /d "%FULL_PATH_OUTSIDE%"
    start "" "Impresora Guia Despacho.exe"
    exit
)

:: 3. Error si no se encuentra en ningun buscador
echo Error: No se pudo localizar la aplicacion.
echo Ruta intentada (Local): %FULL_PATH_INSIDE%
echo Ruta intentada (Escritorio): %FULL_PATH_OUTSIDE%
echo.
echo Asegurese de que la carpeta 'release-packager' exista dentro de 'impresora'.
pause
