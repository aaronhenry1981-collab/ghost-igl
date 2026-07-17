@echo off
REM Recon 6 Reddit Reply Helper.
REM 1. Highlight the Reddit thread (your comment + the reply), Ctrl+C.
REM 2. Double-click this file.
REM 3. The drafted reply prints below AND is copied to your clipboard.
REM 4. Paste into Reddit, edit, post.
REM %~dp0 = this script's own folder — location-independent (see run-watcher.bat).
cd /d "%~dp0"
node reply-helper.mjs
pause
