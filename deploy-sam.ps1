# Deploy CloudFormation stack updates for Ghost IGL.
# Run this after editing aws/template.yaml — pushes route changes (e.g. /desktop/verify),
# new env vars on Lambda functions, and any other infra additions.
#
# Usage:
#   .\deploy-sam.ps1
#
# Why this exists: there's no samconfig.toml on this machine. `sam deploy` packages
# every local Lambda CodeUri before creating the CloudFormation change set; sending
# the built template directly to CloudFormation leaves local paths in the template
# and is rejected before deployment.

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
Write-Host "[1/5] Validating template..." -ForegroundColor Yellow
aws cloudformation validate-template --template-body "file://$TemplateFile" --region $Region | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Error "Template validation failed."; exit 1 }
Write-Host "    OK" -ForegroundColor DarkGreen

# 2. Build with SAM (so CodeUri references resolve and deps get bundled)
Write-Host ""
Write-Host "[2/5] sam build..." -ForegroundColor Yellow
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
Write-Host "[3/5] Deploying stack updates..." -ForegroundColor Yellow

$BuiltTemplate = Join-Path $PSScriptRoot 'aws\.aws-sam\build\template.yaml'
if (-not (Test-Path $BuiltTemplate)) {
    Write-Error "Built template not found at $BuiltTemplate. Did sam build succeed?"
    exit 1
}

sam deploy `
    --template-file $BuiltTemplate `
    --stack-name $StackName `
    --region $Region `
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
    --resolve-s3 `
    --no-confirm-changeset `
    --no-fail-on-empty-changeset `
    --parameter-overrides `
        StripePriceIdProFounding=price_1TPtOKJNddvjgWcg47I16AQp `
        StripePriceIdChampionRegular=price_1TPtOYJNddvjgWcgfEWjzGnp

if ($LASTEXITCODE -ne 0) {
    Write-Error "CloudFormation deploy failed. Check the AWS console for stack events."
    exit 1
}
Write-Host "    OK" -ForegroundColor DarkGreen

# 4. The coaching booking Lambda is intentionally managed outside this stack.
# Reattach its exact routes after every HttpApi update so CloudFormation cannot
# silently remove booking, checkout, or appointment management again.
Write-Host ""
Write-Host "[4/5] Verifying coaching booking routes..." -ForegroundColor Yellow
& (Join-Path $PSScriptRoot 'scripts\ensure-booking-routes.ps1')
if ($LASTEXITCODE -ne 0) { Write-Error "Booking route verification failed."; exit 1 }

# 5. Smoke check the existing protected endpoint is reachable
Write-Host ""
Write-Host "[5/5] Verifying /desktop/verify route..." -ForegroundColor Yellow
$ApiBase = 'https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod'
try {
    # A deployed protected handler returns 400 for an invalid payload or 401
    # when the authorizer rejects the unsigned smoke request. A 404 means the
    # route itself is missing.
    $resp = Invoke-WebRequest -Uri "$ApiBase/desktop/verify" -Method POST -Body '{}' -ContentType 'application/json' -ErrorAction SilentlyContinue
    if ($resp.StatusCode -in @(400, 401)) {
        Write-Host "    OK (protected handler is reachable)" -ForegroundColor DarkGreen
    } else {
        Write-Warning "Unexpected status: $($resp.StatusCode)"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -in @(400, 401)) {
        Write-Host "    OK (protected handler is reachable)" -ForegroundColor DarkGreen
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
