# Reads Discord credentials from update-discord-params.ps1 (already on disk)
# and registers the slash commands. Run from repo root:
#   powershell -ExecutionPolicy Bypass -File scripts\register-discord-commands.ps1

$paramsFile = Join-Path $PSScriptRoot "update-discord-params.ps1"
if (-not (Test-Path $paramsFile)) {
    Write-Error "Missing $paramsFile. Create it first with your token."
    exit 1
}

$content = Get-Content $paramsFile -Raw

function Get-Var([string]$name, [string]$text) {
    if ($text -match "\`$$name\s*=\s*`"([^`"]+)`"") { return $Matches[1] }
    return $null
}

$BotToken = Get-Var "BotToken" $content
$AppId    = Get-Var "AppId" $content

if (-not $BotToken -or $BotToken -eq "PASTE_NEW_TOKEN_HERE") {
    Write-Error "BotToken not set in update-discord-params.ps1."
    exit 1
}
if (-not $AppId) {
    Write-Error "AppId not found in update-discord-params.ps1."
    exit 1
}

$env:DISCORD_APPLICATION_ID = $AppId
$env:DISCORD_BOT_TOKEN = $BotToken

Write-Host "Registering slash commands globally (propagation can take up to 1 hour)..."
node scripts/register-discord-commands.mjs

# Scrub env vars from this process so they don't linger
Remove-Item Env:DISCORD_BOT_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:DISCORD_APPLICATION_ID -ErrorAction SilentlyContinue
