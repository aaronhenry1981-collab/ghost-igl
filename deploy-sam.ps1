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

# 4. Preserve booking routes. The booking Lambda is deployed separately from
#    this stack, while SAM updates the shared HTTP API from an OpenAPI body.
#    API updates can therefore remove those out-of-stack routes. Reconcile them
#    idempotently after every stack update before running smoke tests.
Write-Host ""
Write-Host "[4/5] Reconciling booking routes..." -ForegroundColor Yellow
$ApiId = 'u0k402df6j'
$BookingFunctionArn = 'arn:aws:lambda:us-east-1:183678667221:function:recon6-booking'
$BookingIntegrationUri = "arn:aws:apigateway:${Region}:lambda:path/2015-03-31/functions/${BookingFunctionArn}/invocations"
$BookingRoutes = @(
    'GET /booking/slots',
    'POST /booking/hold',
    'POST /booking/checkout',
    'POST /booking/finalize',
    'GET /booking/manage',
    'POST /booking/manage'
)

$integrations = aws apigatewayv2 get-integrations --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$bookingIntegration = $integrations.Items | Where-Object { $_.IntegrationUri -eq $BookingIntegrationUri } | Select-Object -First 1
if (-not $bookingIntegration) {
    $integrationId = aws apigatewayv2 create-integration `
        --api-id $ApiId `
        --integration-type AWS_PROXY `
        --integration-uri $BookingIntegrationUri `
        --payload-format-version 2.0 `
        --timeout-in-millis 30000 `
        --region $Region `
        --query IntegrationId `
        --output text
    if ($LASTEXITCODE -ne 0) { Write-Error "Could not create booking integration."; exit 1 }
} else {
    $integrationId = $bookingIntegration.IntegrationId
}

$existingRoutes = aws apigatewayv2 get-routes --api-id $ApiId --region $Region --output json | ConvertFrom-Json
foreach ($routeKey in $BookingRoutes) {
    if (-not ($existingRoutes.Items | Where-Object { $_.RouteKey -eq $routeKey })) {
        aws apigatewayv2 create-route `
            --api-id $ApiId `
            --route-key $routeKey `
            --target "integrations/$integrationId" `
            --region $Region | Out-Null
        if ($LASTEXITCODE -ne 0) { Write-Error "Could not restore booking route: $routeKey"; exit 1 }
    }
}

$ApiBase = 'https://u0k402df6j.execute-api.us-east-1.amazonaws.com/prod'
try {
    $bookingResponse = Invoke-WebRequest -Uri "$ApiBase/booking/slots" -Method GET -ErrorAction Stop
    if ($bookingResponse.StatusCode -ne 200) { throw "Unexpected status $($bookingResponse.StatusCode)" }
    Write-Host "    OK (booking slots returned 200)" -ForegroundColor DarkGreen
} catch {
    Write-Error "Booking route reconciliation failed its smoke test: $_"
    exit 1
}

# 5. Smoke check the new endpoint is reachable
Write-Host ""
Write-Host "[5/5] Verifying /desktop/verify route..." -ForegroundColor Yellow
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
