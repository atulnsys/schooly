@echo off
echo %DATE% %TIME% launcher-start >> C:\Projects\schooly\launcher.log
"C:\Program Files\nodejs\node.exe" "C:\Projects\schooly\dist\server.cjs"
