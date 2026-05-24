# Fast code-only deploy for the Stripe webhook Lambda.
# Bypasses SAM - just zips lambda/webhook/ and uploads via AWS CLI.
# Use when you only changed lambda/webhook/index.mjs (no infra changes).
#
# Usage: .\deploy-webhook.ps1

$ErrorActionPreference = 'Stop'

$ProjectRoot = $PSScriptRoot
$LambdaDir = Join-Path $ProjectRoot 'lambda\webhook'
$ZipPath = Join-Path $env:TEMP 'ghost-igl-webhook.zip'
$FunctionName = 'ghost-igl-stripe-webhook'
$Region = 'us-east-1'

Write-Host ""
Write-Host "== Ghost IGL webhook deploy ==" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path (Join-Path $LambdaDir 'index.mjs'))) {
    Write-Error "Can't find lambda/webhook/index.mjs"
    exit 1
}

Write-Host "[1/3] Installing dependencies..." -ForegroundColor Yellow
Push-Location $LambdaDir
try {
    npm install --omit=dev --silent
    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm install failed"
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host "[2/3] Packaging..." -ForegroundColor Yellow
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Compress-Archive -Path (Join-Path $LambdaDir '*') -DestinationPath $ZipPath -Force
$size = [math]::Round((Get-Item $ZipPath).Length / 1KB, 1)
Write-Host "-> Zip size: $size KB" -ForegroundColor DarkGray

Write-Host "[3/3] Updating $FunctionName..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name $FunctionName `
    --zip-file "fileb://$ZipPath" `
    --region $Region `
    --output json | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Lambda update failed"
    exit 1
}

aws lambda wait function-updated --function-name $FunctionName --region $Region
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Wait failed. Lambda may still be propagating."
}

Remove-Item $ZipPath -Force

Write-Host ""
Write-Host "== Webhook deploy complete ==" -ForegroundColor Green
Write-Host "Next: replay a failed delivery from the Stripe dashboard to test." -ForegroundColor Green
Write-Host ""
