param(
    [string]$ApiId = 'u0k402df6j',
    [string]$Region = 'us-east-1',
    [string]$BookingFunctionArn = 'arn:aws:lambda:us-east-1:183678667221:function:recon6-booking'
)

$ErrorActionPreference = 'Stop'
$Aws = (Get-Command aws -ErrorAction Stop).Source

$policy = & $Aws lambda get-policy --function-name $BookingFunctionArn --region $Region --query Policy --output text
if ($LASTEXITCODE -ne 0 -or $policy -notmatch [regex]::Escape("$ApiId/*")) {
    throw 'The existing booking Lambda permission does not allow this API. Refusing to widen it automatically.'
}

$integrations = & $Aws apigatewayv2 get-integrations --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$integration = $integrations.Items | Where-Object { $_.IntegrationUri -eq $BookingFunctionArn } | Select-Object -First 1
if (-not $integration) {
    $integrationId = & $Aws apigatewayv2 create-integration --api-id $ApiId --region $Region `
        --integration-type AWS_PROXY --integration-uri $BookingFunctionArn --payload-format-version 2.0 `
        --query IntegrationId --output text
    if ($LASTEXITCODE -ne 0 -or -not $integrationId) { throw 'Could not create the booking API integration.' }
} else {
    $integrationId = $integration.IntegrationId
}

$requiredRoutes = @(
    'GET /booking/slots',
    'POST /booking/hold',
    'POST /booking/checkout',
    'POST /booking/finalize',
    'POST /booking/credits',
    'GET /booking/manage',
    'POST /booking/manage',
    'GET /admin/bookings',
    'POST /admin/booking'
)

$routes = & $Aws apigatewayv2 get-routes --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$target = "integrations/$integrationId"
foreach ($routeKey in $requiredRoutes) {
    $existing = $routes.Items | Where-Object { $_.RouteKey -eq $routeKey } | Select-Object -First 1
    if (-not $existing) {
        & $Aws apigatewayv2 create-route --api-id $ApiId --region $Region --route-key $routeKey --target $target | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Could not create booking route: $routeKey" }
    } elseif ($existing.Target -ne $target) {
        & $Aws apigatewayv2 update-route --api-id $ApiId --region $Region --route-id $existing.RouteId --target $target | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Could not repair booking route: $routeKey" }
    }
}

$finalRoutes = & $Aws apigatewayv2 get-routes --api-id $ApiId --region $Region --query 'Items[].RouteKey' --output json | ConvertFrom-Json
$missing = $requiredRoutes | Where-Object { $_ -notin $finalRoutes }
if ($missing) { throw "Booking route verification failed: $($missing -join ', ')" }

Write-Host "    OK ($($requiredRoutes.Count) booking routes attached)" -ForegroundColor DarkGreen
