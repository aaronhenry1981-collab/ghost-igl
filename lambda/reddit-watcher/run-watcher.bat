@echo off
REM Recon 6 Reddit Watcher — local runner.
REM Double-click to run on demand, or let Task Scheduler fire it every 4h.
REM Fetches Reddit posts, drafts comments via Bedrock, uploads digest to S3.
cd /d "C:\Users\aaron\OneDrive\Desktop\ghost-igl\lambda\reddit-watcher"
node local-run.mjs
REM Keep window open if run by double-click so you can see the result.
if "%1"=="" pause
