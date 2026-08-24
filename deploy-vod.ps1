# Safe code-only deployment for ghost-igl-vod-api.
#
# The VOD handler imports coach-contract.mjs and reads every *-context.json at
# cold start. A generic Lambda ZIP command previously uploaded only index.mjs,
# package.json, and node_modules, leaving production unable to import at all.
# This script names and verifies every runtime asset before AWS is touched.
#
# Usage:
#   .\deploy-vod.ps1                 # test, package, deploy, and smoke-test
#   .\deploy-vod.ps1 -PackageOnly    # create ghost-igl-vod-api.zip only

param(
    [switch]$PackageOnly
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = $PSScriptRoot
$LambdaDir = Join-Path $ProjectRoot 'lambda\vod'
$FunctionName = 'ghost-igl-vod-api'
$Region = 'us-east-1'
$ZipPath = if ($PackageOnly) {
    Join-Path $ProjectRoot 'ghost-igl-vod-api.zip'
} else {
    Join-Path $env:TEMP 'ghost-igl-vod-api.zip'
}

$ContextIds = @(
    'r6', 'cs2', 'valorant', 'ow2', 'apex', 'mvr', 'halo', 'finals', 'cod', 'fn', 'rl',
    'lol', 'dota2', 'eafc', 'tk8', 'sf6', 'pubg', 'deadlock', 'naraka', 'nba2k'
)
$RequiredFiles = @('index.mjs', 'coach-contract.mjs', 'rank-snapshot.mjs', 'package.json', 'package-lock.json')
$RequiredFiles += $ContextIds | ForEach-Object { "$_-context.json" }

Write-Host ""
Write-Host "== Ghost IGL VOD safe deploy ==" -ForegroundColor Cyan

foreach ($name in $RequiredFiles) {
    $path = Join-Path $LambdaDir $name
    if (-not (Test-Path $path -PathType Leaf)) {
        Write-Error "Required runtime file is missing: $path"
        exit 1
    }
}

Write-Host "[1/5] Running syntax and contract tests..." -ForegroundColor Yellow
Push-Location $LambdaDir
try {
    node --check index.mjs
    if ($LASTEXITCODE -ne 0) { throw 'index.mjs syntax check failed' }
    node --check coach-contract.mjs
    if ($LASTEXITCODE -ne 0) { throw 'coach-contract.mjs syntax check failed' }
    node --test coach-contract.test.mjs rank-snapshot.test.mjs
    if ($LASTEXITCODE -ne 0) { throw 'VOD contract tests failed' }

    Write-Host "[2/5] Installing production dependencies..." -ForegroundColor Yellow
    npm ci --omit=dev --silent
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
} finally {
    Pop-Location
}

Write-Host "[3/5] Packaging all runtime assets..." -ForegroundColor Yellow
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
$PackageInputs = $RequiredFiles | ForEach-Object { Join-Path $LambdaDir $_ }
$PackageInputs += Join-Path $LambdaDir 'node_modules'
Compress-Archive -Path $PackageInputs -DestinationPath $ZipPath -Force

$VerifyDir = Join-Path $env:TEMP ("ghost-igl-vod-verify-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $VerifyDir | Out-Null
try {
    Expand-Archive -Path $ZipPath -DestinationPath $VerifyDir -Force
    foreach ($name in $RequiredFiles) {
        if (-not (Test-Path (Join-Path $VerifyDir $name) -PathType Leaf)) {
            throw "Package verification failed; ZIP is missing $name"
        }
    }
    if (-not (Test-Path (Join-Path $VerifyDir 'node_modules') -PathType Container)) {
        throw 'Package verification failed; ZIP is missing node_modules'
    }
} finally {
    Remove-Item $VerifyDir -Recurse -Force
}

$sizeMb = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)
Write-Host "    Verified $($RequiredFiles.Count) required files; ZIP is $sizeMb MB." -ForegroundColor DarkGreen

if ($PackageOnly) {
    Write-Host "Package ready: $ZipPath" -ForegroundColor Green
    exit 0
}

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error 'AWS CLI is not available. Re-run with -PackageOnly or install AWS CLI v2.'
    exit 1
}

Write-Host "[4/5] Updating $FunctionName code only..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name $FunctionName `
    --zip-file "fileb://$ZipPath" `
    --region $Region `
    --output json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Lambda code update failed' }

aws lambda wait function-updated --function-name $FunctionName --region $Region
if ($LASTEXITCODE -ne 0) { throw 'Lambda did not reach the updated state' }

Write-Host "[5/5] Cold-start smoke test..." -ForegroundColor Yellow
$PayloadPath = Join-Path $env:TEMP 'ghost-igl-vod-smoke-event.json'
$ResponsePath = Join-Path $env:TEMP 'ghost-igl-vod-smoke-response.json'
'{"requestContext":{"http":{"method":"OPTIONS"}},"headers":{"origin":"https://r6coaching.com"}}' |
    Set-Content -Path $PayloadPath -Encoding utf8

try {
    $InvokeMeta = aws lambda invoke `
        --function-name $FunctionName `
        --region $Region `
        --cli-binary-format raw-in-base64-out `
        --payload "fileb://$PayloadPath" `
        $ResponsePath `
        --output json | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) { throw 'Lambda smoke invocation failed' }
    if ($InvokeMeta.FunctionError) { throw "Lambda returned FunctionError: $($InvokeMeta.FunctionError)" }
    $Smoke = Get-Content $ResponsePath -Raw | ConvertFrom-Json
    if ($Smoke.statusCode -ne 200) { throw "Unexpected smoke status: $($Smoke.statusCode)" }
} finally {
    Remove-Item $PayloadPath, $ResponsePath -Force -ErrorAction SilentlyContinue
}

$Published = aws lambda publish-version `
    --function-name $FunctionName `
    --region $Region `
    --description "Verified VOD package with contract and game contexts" `
    --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { Write-Warning 'Code is healthy, but publishing a rollback version failed.' }

Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "VOD is healthy. Published rollback version $($Published.Version)." -ForegroundColor Green
