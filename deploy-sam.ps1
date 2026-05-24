# Deploy CloudFormation stack updates for Ghost IGL.
# Run this after editing aws/template.yaml — pushes route changes (e.g. /desktop/verify),
# new env vars on Lambda functions, and any other infra additions.
#
# Usage:
#   .\deploy-sam.ps1
#
# Why this exists: there's no samconfig.toml on this machine, so `sam deploy` would
# require interactive guided setup. Using `aws cloudformation deploy` directly with
# UsePreviousValue=true preserves the NoEcho secret params (Stripe keys, webhook
# secret) without re-prompting. Stack name is the same as the existing prod stack.

$ErrorActionPreference = 'Stop'

$StackName = 'ghost-igl'
$Region    = 'us-east-1'
$TemplateFile = Join-Path $PSScriptRoot 'aws\template.yaml'

Write-Host ""
Write-Host "== Ghost IGL SAM deploy ==" -ForegroundColor Cyan
Write-Host "Stack: $StackName  Region: $Region" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path $TemplateFile)) {
    Write-Error "Template not found at $TemplateFile"
    exit 1
}

# 1. Validate template
Write-Host "[1/4] Validating template..." -ForegroundColor Yellow
aws cloudformation validate-template --template-body "file://$TemplateFile" --region $Region | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Error "Template validation failed."; exit 1 }
Write-Host "    OK" -ForegroundColor DarkGreen

# 2. Build with SAM (so CodeUri references resolve and deps get bundled)
Write-Host ""
Write-Host "[2/4] sam build..." -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot 'aws')
sam build
if ($LASTEXITCODE -ne 0) { Write-Error "sam build failed."; exit 1 }
Set-Location $PSScriptRoot
Write-Host "    OK" -ForegroundColor DarkGreen

# 3. Deploy with parameter overrides for the NEW params we added.
#    Existing params (Stripe secrets, webhook secret, etc.) keep their previous
#    values automatically because we don't pass them — CloudFormation reuses
#    the existing values for any parameter not listed in --parameter-overrides.
Write-Host ""
Write-Host "[3/4] Deploying stack updates..." -ForegroundColor Yellow

$BuiltTemplate = Join-Path $PSScriptRoot 'aws\.aws-sam\build\template.yaml'
if (-not (Test-Path $BuiltTemplate)) {
    Write-Error "Built template not found at $BuiltTemplate. Did sam build succeed?"
    exit 1
}

aws cloudformation deploy `
    --template-file $BuiltTemplate `
    --stack-name $StackName `
    --region $Region `
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
    --no-fail-on-empty-changeset `
    --parameter-overrides `
        StripePriceIdProFounding=price_1TPtOKJNddvjgWcg47I16AQp `
        StripePriceIdChampionRegular=price_1TPtOYJNddvjgWcgfEWjzGnp

if ($LASTEXITCODE -ne 0) {
    Write-Error "CloudFormation deploy failed. Check the AWS console for stack events."
    exit 1
}
Write-Host "    OK" -ForegroundColor DarkGreen

# 4. Smoke check the new endpoint is reachable
Write-Host ""
Write-Host "[4/4] Verifying /desktop/verify route..." -ForegroundColor Yellow
$ApiBase = 'https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod'
try {
    # Should return 400 "Missing email or token" — that's the new handler responding.
    # If it returns 404, the route isn't deployed.
    $resp = Invoke-WebRequest -Uri "$ApiBase/desktop/verify" -Method POST -Body '{}' -ContentType 'application/json' -ErrorAction SilentlyContinue
    if ($resp.StatusCode -eq 400) {
        Write-Host "    OK (got expected 400 from new handler)" -ForegroundColor DarkGreen
    } else {
        Write-Warning "Unexpected status: $($resp.StatusCode)"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "    OK (got expected 400 from new handler)" -ForegroundColor DarkGreen
    } elseif ($statusCode -eq 404) {
        Write-Warning "Got 404 — route not deployed. Check sam build output for missing events."
    } else {
        Write-Warning "Got HTTP $statusCode — investigate."
    }
}

Write-Host ""
Write-Host "== Deploy complete ==" -ForegroundColor Green
Write-Host "API base:           $ApiBase" -ForegroundColor Green
Write-Host "Desktop verify URL: $ApiBase/desktop/verify" -ForegroundColor Green
Write-Host ""
