@echo off
REM Recon 6 Reddit Watcher — local runner.
REM Double-click to run on demand, or let Task Scheduler fire it every 4h.
REM Fetches Reddit posts, drafts comments via Bedrock, uploads digest to S3.
REM %~dp0 = this script's own folder — location-independent, so moving the repo
REM never silently points this at a stale copy again.
cd /d "%~dp0"
node local-run.mjs
REM Keep window open if run by double-click so you can see the result.
if "%1"=="" pause
