@echo off
echo "wut"
"%SPECTRON_NODE_PATH%" "%SPECTRON_CHROMEDRIVER_PATH%" %*
if ERRORLEVEL 1 exit /b 1
exit /b 0