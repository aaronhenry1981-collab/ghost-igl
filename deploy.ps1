# Ghost IGL - one-shot deploy script
# Usage (from anywhere):  .\deploy.ps1
# Or from the project root: powershell -ExecutionPolicy Bypass -File deploy.ps1
#
# What it does:
#   1. Jumps to the project root (wherever this script lives)
#   2. Runs the full build pipeline (sitemap + OG + guides + Vite)
#   3. Syncs dist/ to S3
#   4. Fixes content-type on the SVG OG images so crawlers render them
#   5. Invalidates CloudFront

$ErrorActionPreference = 'Stop'

$ProjectRoot = $PSScriptRoot
$S3Bucket = 'r6coaching.com-site'
$CloudFrontId = 'E2WUR8DDHCOYC9'
$Region = 'us-east-1'

Write-Host ""
Write-Host "== Ghost IGL deploy ==" -ForegroundColor Cyan
Write-Host ""

# Make sure we're in the project root
Set-Location $ProjectRoot
Write-Host "-> Working dir: $ProjectRoot"

# Locate aws.exe / aws.cmd / aws (pip-installed) - PowerShell sessions
# frequently don't inherit PATH after CLI install
function Test-AwsWorks {
    param([string]$Path)
    if (-not $Path -or -not (Test-Path $Path)) { return $false }
    try {
        $null = & $Path --version 2>&1
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    }
}

function Find-AwsCli {
    $candidates = @()

    # 1. Whatever is on PATH
    $cmd = Get-Command aws -ErrorAction SilentlyContinue
    if ($cmd) { $candidates += $cmd.Source }

    # 2. Common CLI v2 installer locations (preferred)
    $candidates += @(
        "$env:ProgramFiles\Amazon\AWSCLIV2\aws.exe",
        "${env:ProgramFiles(x86)}\Amazon\AWSCLIV2\aws.exe",
        "$env:LOCALAPPDATA\Programs\AWSCLIV2\aws.exe"
    )

    # 3. where.exe (catches anything else on PATH)
    try {
        $whereOut = & where.exe aws 2>$null
        if ($whereOut) {
            $candidates += ($whereOut -split "`r?`n") | Where-Object { $_ }
        }
    } catch { }

    # 4. Pip-installed CLI in any Python distribution under the user (last resort - often broken)
    $pythonRoots = @(
        "$env:LOCALAPPDATA\Programs\Python",
        "$env:APPDATA\Python"
    )
    foreach ($root in $pythonRoots) {
        if (Test-Path $root) {
            Get-ChildItem $root -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                $scripts = Join-Path $_.FullName 'Scripts'
                foreach ($name in @('aws.exe', 'aws.cmd', 'aws.bat')) {
                    $p = Join-Path $scripts $name
                    if (Test-Path $p) { $candidates += $p }
                }
            }
        }
    }

    # Return the first candidate that actually runs
    foreach ($c in $candidates) {
        if (Test-AwsWorks $c) { return $c }
    }

    return $null
}

$Aws = Find-AwsCli
if (-not $Aws) {
    Write-Error "aws.exe not found. Install AWS CLI v2 or open a new PowerShell session so PATH refreshes."
    exit 1
}
Write-Host "-> Using aws: $Aws"

# 1. Build
Write-Host ""
Write-Host "[1/4] Building..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed. Fix the errors above and re-run."
    exit 1
}

# 2. Sync dist/. Hashed JS/CSS chunks in dist/assets/ get the 1-year
# immutable cache (their filenames change every build); everything else
# (HTML, JSON, XML) gets short cache so static-page updates land within
# minutes instead of waiting for browsers to expire stale heuristic
# caches. Previous deploys left Cache-Control unset entirely, which
# caused stale static pages (/tools/, /blog/) to linger for days.
Write-Host ""
Write-Host "[2/4] Syncing dist/ to s3://$S3Bucket ..." -ForegroundColor Yellow
& $Aws s3 sync dist/ "s3://$S3Bucket" --delete --region $Region `
    --cache-control "public, max-age=0, must-revalidate"
if ($LASTEXITCODE -ne 0) {
    Write-Error "S3 sync failed."
    exit 1
}

# Override cache for hashed asset files — they're immutable forever.
Write-Host "  -> Setting long cache on dist/assets/*"
& $Aws s3 cp dist/assets/ "s3://$S3Bucket/assets/" --recursive --region $Region `
    --metadata-directive REPLACE `
    --cache-control "public, max-age=31536000, immutable"
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Asset cache-control update failed - assets will still load but with short cache."
}

# 3. Fix content-type on SVG OG images
if (Test-Path 'dist/guides/og') {
    Write-Host ""
    Write-Host "[3/4] Setting image/svg+xml content-type on OG images..." -ForegroundColor Yellow
    & $Aws s3 cp dist/guides/og/ "s3://$S3Bucket/guides/og/" --recursive --content-type "image/svg+xml" --region $Region
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "OG image content-type fix failed - crawlers may not render previews correctly."
    }
} else {
    Write-Host ""
    Write-Host "[3/4] No dist/guides/og folder - skipping content-type fix." -ForegroundColor DarkGray
}

# 4. Invalidate CloudFront
Write-Host ""
Write-Host "[4/4] Invalidating CloudFront ($CloudFrontId)..." -ForegroundColor Yellow
$InvalidationResult = & $Aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths "/*" --region $Region --output json 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "CloudFront invalidation failed."
    exit 1
}

try {
    $Inv = $InvalidationResult | ConvertFrom-Json
    $InvId = $Inv.Invalidation.Id
    Write-Host "-> Invalidation queued: $InvId" -ForegroundColor DarkGray
} catch {
    # Non-critical - we already succeeded
}

Write-Host ""
Write-Host "== Deploy complete ==" -ForegroundColor Green
Write-Host "Site: https://r6coaching.com" -ForegroundColor Green
Write-Host "CloudFront invalidation usually finishes in 1-2 minutes." -ForegroundColor Green
Write-Host ""

# Ping IndexNow to fast-track Bing/Yandex indexation. Runs after CloudFront
# starts the invalidation; the IndexNow key file is reachable via S3 directly
# even before the CDN settles. Failure is non-fatal — deploy still succeeds.
Write-Host "-> Pinging IndexNow (Bing/Yandex/IndexNow.org) for instant indexation..." -ForegroundColor Cyan
try {
    Start-Sleep -Seconds 5  # let CDN settle so the key file is reachable
    & node scripts/indexnow-ping.mjs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "IndexNow ping failed (non-fatal). Run 'npm run indexnow' manually after CloudFront finishes." -ForegroundColor Yellow
    }
} catch {
    Write-Host "IndexNow ping errored: $_" -ForegroundColor Yellow
}
Write-Host ""
