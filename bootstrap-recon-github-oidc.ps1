# One-time bootstrap for secure Recon GitHub Actions -> AWS deployment.
# Run from the ghost-igl repository root in a PowerShell session where AWS CLI
# is already authenticated to account 183678667221 with IAM admin permissions.
#
# This does NOT create access keys and does NOT write secrets to GitHub.
# It creates/updates one narrowly-scoped OIDC role and a private SAM artifact bucket.

$ErrorActionPreference = 'Stop'
$Region = 'us-east-1'
$ExpectedAccount = '183678667221'
$RoleName = 'github-actions-recon-deploy'
$ArtifactBucket = 'recon-player-data-sam-artifacts-183678667221'
$TrustFile = Join-Path $PSScriptRoot 'aws\github-actions-recon-deploy-trust.json'
$PolicyFile = Join-Path $PSScriptRoot 'aws\github-actions-recon-deploy-permissions.json'

function Find-AwsCli {
    $cmd = Get-Command aws -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        "$env:ProgramFiles\Amazon\AWSCLIV2\aws.exe",
        "${env:ProgramFiles(x86)}\Amazon\AWSCLIV2\aws.exe",
        "$env:LOCALAPPDATA\Programs\AWSCLIV2\aws.exe"
    )
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path $candidate)) { return $candidate }
    }
    return $null
}

$Aws = Find-AwsCli
if (-not $Aws) {
    throw 'AWS CLI v2 was not found. Install/open a PowerShell session with aws.exe available, then rerun.'
}
if (-not (Test-Path $TrustFile)) { throw "Missing $TrustFile" }
if (-not (Test-Path $PolicyFile)) { throw "Missing $PolicyFile" }

Write-Host '== Recon GitHub OIDC bootstrap ==' -ForegroundColor Cyan
Write-Host "AWS CLI: $Aws" -ForegroundColor DarkGray

$Account = & $Aws sts get-caller-identity --query Account --output text --region $Region
if ($LASTEXITCODE -ne 0) { throw 'Could not read the current AWS identity.' }
if ($Account.Trim() -ne $ExpectedAccount) {
    throw "Refusing bootstrap: expected AWS account $ExpectedAccount, got $($Account.Trim())."
}
Write-Host "AWS account verified: $ExpectedAccount" -ForegroundColor Green

$OidcArn = "arn:aws:iam::$ExpectedAccount`:oidc-provider/token.actions.githubusercontent.com"
$Providers = & $Aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[].Arn' --output text
if ($LASTEXITCODE -ne 0) { throw 'Could not inspect GitHub OIDC providers.' }
if (($Providers -split '\s+') -notcontains $OidcArn) {
    throw "GitHub OIDC provider is missing from this AWS account. Iron Front normally owns this provider; restore it before continuing: $OidcArn"
}
Write-Host 'GitHub OIDC provider found.' -ForegroundColor Green

& $Aws iam get-role --role-name $RoleName --output json *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Updating trust policy on existing role $RoleName..." -ForegroundColor Yellow
    & $Aws iam update-assume-role-policy `
        --role-name $RoleName `
        --policy-document "file://$TrustFile"
    if ($LASTEXITCODE -ne 0) { throw 'Failed to update the Recon deploy role trust policy.' }
} else {
    Write-Host "Creating role $RoleName..." -ForegroundColor Yellow
    & $Aws iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document "file://$TrustFile" `
        --description 'Recon production deploy from aaronhenry1981-collab/ghost-igl main via GitHub OIDC' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Failed to create the Recon deploy role.' }
}

Write-Host 'Applying scoped Recon deployment permissions...' -ForegroundColor Yellow
& $Aws iam put-role-policy `
    --role-name $RoleName `
    --policy-name ReconProductionDeploy `
    --policy-document "file://$PolicyFile"
if ($LASTEXITCODE -ne 0) { throw 'Failed to apply the Recon deploy policy.' }

Write-Host "Checking SAM artifact bucket $ArtifactBucket..." -ForegroundColor Yellow
& $Aws s3api head-bucket --bucket $ArtifactBucket 2>$null
if ($LASTEXITCODE -ne 0) {
    & $Aws s3api create-bucket --bucket $ArtifactBucket --region $Region | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Failed to create the Recon SAM artifact bucket.' }

    & $Aws s3api put-public-access-block `
        --bucket $ArtifactBucket `
        --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Failed to lock down the SAM artifact bucket.' }

    & $Aws s3api put-bucket-encryption `
        --bucket $ArtifactBucket `
        --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Failed to enable SAM artifact bucket encryption.' }
}

Write-Host ''
Write-Host 'Bootstrap complete.' -ForegroundColor Green
Write-Host "Role: arn:aws:iam::$ExpectedAccount`:role/$RoleName" -ForegroundColor Green
Write-Host 'No AWS access keys were created or copied to GitHub.' -ForegroundColor Green
Write-Host 'Return to ChatGPT and say: OIDC bootstrap complete' -ForegroundColor Cyan
