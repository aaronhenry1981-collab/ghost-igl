param(
    [string]$ApiId = 'u0k402df6j',
    [string]$Region = 'us-east-1',
    [string]$CoachingFunctionArn = 'arn:aws:lambda:us-east-1:183678667221:function:recon6-coaching-sync',
    [string]$ProgressFunctionArn = 'arn:aws:lambda:us-east-1:183678667221:function:recon6-climb-progress',
    [string]$AwsPath = ''
)

if (-not $AwsPath) {
    $awsCommand = Get-Command aws -ErrorAction SilentlyContinue
    if ($awsCommand) {
        $AwsPath = $awsCommand.Source
    } elseif (Test-Path -LiteralPath 'C:\Program Files\Amazon\AWSCLIV2\aws.exe') {
        $AwsPath = 'C:\Program Files\Amazon\AWSCLIV2\aws.exe'
    } else {
        throw 'AWS CLI was not found.'
    }
}

function Assert-ApiPermission([string]$FunctionArn) {
    $policy = & $AwsPath lambda get-policy --function-name $FunctionArn --region $Region --query Policy --output text
    if ($LASTEXITCODE -ne 0 -or $policy -notmatch [regex]::Escape("$ApiId/*")) {
        throw "The Lambda permission for $FunctionArn does not allow API $ApiId. Refusing to widen it automatically."
    }
}

function Get-OrCreateIntegration([string]$FunctionArn, [object[]]$Integrations) {
    $existing = $Integrations | Where-Object { $_.IntegrationUri -match [regex]::Escape($FunctionArn) } | Select-Object -First 1
    if ($existing) { return $existing.IntegrationId }

    $integrationId = & $AwsPath apigatewayv2 create-integration --api-id $ApiId --region $Region `
        --integration-type AWS_PROXY --integration-uri $FunctionArn --payload-format-version 2.0 `
        --timeout-in-millis 30000 --query IntegrationId --output text
    if ($LASTEXITCODE -ne 0 -or -not $integrationId) {
        throw "Could not create the API integration for $FunctionArn."
    }
    return $integrationId
}

Assert-ApiPermission $CoachingFunctionArn
Assert-ApiPermission $ProgressFunctionArn

$integrationsResponse = & $AwsPath apigatewayv2 get-integrations --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$coachingIntegrationId = Get-OrCreateIntegration $CoachingFunctionArn $integrationsResponse.Items
$progressIntegrationId = Get-OrCreateIntegration $ProgressFunctionArn $integrationsResponse.Items

$requiredRoutes = @(
    @{ Key = 'GET /me/coaching-history'; IntegrationId = $coachingIntegrationId },
    @{ Key = 'GET /me/coaching-profile'; IntegrationId = $coachingIntegrationId },
    @{ Key = 'POST /me/coaching-events'; IntegrationId = $coachingIntegrationId },
    @{ Key = 'GET /me/climb-progress'; IntegrationId = $progressIntegrationId },
    @{ Key = 'PUT /me/climb-progress'; IntegrationId = $progressIntegrationId }
)

$routesResponse = & $AwsPath apigatewayv2 get-routes --api-id $ApiId --region $Region --output json | ConvertFrom-Json
foreach ($required in $requiredRoutes) {
    $target = "integrations/$($required.IntegrationId)"
    $existing = $routesResponse.Items | Where-Object { $_.RouteKey -eq $required.Key } | Select-Object -First 1
    if (-not $existing) {
        & $AwsPath apigatewayv2 create-route --api-id $ApiId --region $Region --route-key $required.Key --target $target | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Could not create route: $($required.Key)" }
    } elseif ($existing.Target -ne $target) {
        & $AwsPath apigatewayv2 update-route --api-id $ApiId --region $Region --route-id $existing.RouteId --target $target | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Could not repair route: $($required.Key)" }
    }
}

$verifiedRoutes = & $AwsPath apigatewayv2 get-routes --api-id $ApiId --region $Region --output json | ConvertFrom-Json
$routeProblems = foreach ($required in $requiredRoutes) {
    $target = "integrations/$($required.IntegrationId)"
    $actual = $verifiedRoutes.Items | Where-Object { $_.RouteKey -eq $required.Key } | Select-Object -First 1
    if (-not $actual -or $actual.Target -ne $target) { $required.Key }
}
if ($routeProblems) { throw "Coaching route verification failed: $($routeProblems -join ', ')" }

Write-Host "    OK ($($requiredRoutes.Count) coaching/progress routes attached)" -ForegroundColor DarkGreen
