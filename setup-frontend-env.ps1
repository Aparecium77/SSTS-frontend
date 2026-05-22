param(
  [switch]$SkipInstall,
  [switch]$SkipTypeCheck
)

$ErrorActionPreference = "Stop"
$script:MissingRequirements = @()

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Add-RequirementIssue {
  param(
    [string]$Name,
    [string]$Advice
  )

  $script:MissingRequirements += [PSCustomObject]@{
    Name = $Name
    Advice = $Advice
  }
}

function Invoke-Checked {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  $joined = ($Arguments -join " ")
  Write-Host "   $FilePath $joined" -ForegroundColor DarkGray
  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $FilePath $joined"
  }
}

function Test-Command {
  param([string]$CommandName)
  return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

$projectRoot = $PSScriptRoot
Set-Location $projectRoot

Write-Step "Check project directory"
Write-Host "Project root: ."

Write-Step "Check required commands"
if (-not (Test-Command "node")) {
  Add-RequirementIssue "Node.js" "Install Node.js 18+ and make sure 'node -v' works in PowerShell."
} else {
  $nodeVersion = (node -v).Trim()
  Write-Host "Node.js : $nodeVersion"

  try {
    $nodeMajorVersion = [int](($nodeVersion -replace "^v", "").Split(".")[0])
    if ($nodeMajorVersion -lt 18) {
      Add-RequirementIssue "Node.js version" "Upgrade Node.js to 18+."
    }
  } catch {
    Add-RequirementIssue "Node.js version" "Unable to parse Node.js version. Check 'node -v'."
  }
}

if (-not (Test-Command "git")) {
  Add-RequirementIssue "Git" "Install Git and make sure 'git --version' works in PowerShell."
} else {
  $gitVersion = (git --version).Trim()
  Write-Host "Git     : $gitVersion"
}

if (-not (Test-Command "corepack")) {
  Add-RequirementIssue "Corepack" "Install a Node.js version that includes corepack, or enable it manually."
} else {
  Write-Step "Check pnpm through corepack"
  $pnpmVersion = (& corepack.cmd pnpm -v).Trim()
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pnpmVersion)) {
    Write-Host "corepack pnpm is not ready. Trying 'corepack enable'..." -ForegroundColor Yellow
    & corepack.cmd enable
    $pnpmVersion = (& corepack.cmd pnpm -v).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pnpmVersion)) {
      Add-RequirementIssue "pnpm / corepack" "Make sure 'corepack pnpm -v' works. If corepack enable is blocked, install pnpm globally or use a writable Node.js installation."
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($pnpmVersion)) {
    Write-Host "pnpm    : $pnpmVersion"
  }
}

Write-Step "System environment summary"
if ($script:MissingRequirements.Count -gt 0) {
  Write-Host "The following system requirements are missing or incomplete:" -ForegroundColor Yellow
  foreach ($item in $script:MissingRequirements) {
    Write-Host "- $($item.Name): $($item.Advice)" -ForegroundColor Yellow
  }
  Write-Host ""
  Write-Host "Please complete the required system environment first, then run this script again." -ForegroundColor Yellow
  exit 1
} else {
  Write-Host "All required system environments are installed." -ForegroundColor Green
}

Write-Step "Check required files"
$requiredFiles = @(
  ".env",
  ".env.development",
  "package.json",
  "vite.config.ts",
  "postcss.config.cjs",
  "tailwind.config.cjs"
)

foreach ($file in $requiredFiles) {
  if (-not (Test-Path $file)) {
    throw "Missing required file: $file"
  }
}

Write-Step "Install frontend dependencies"
if (-not $SkipInstall) {
  Invoke-Checked "corepack.cmd" @("pnpm", "install")
} else {
  Write-Host "Skipped dependency installation."
}

Write-Step "Run lint"
Invoke-Checked "corepack.cmd" @("pnpm", "lint:eslint")

if (-not $SkipTypeCheck) {
  Write-Step "Run type check"
  Write-Host "Note: the original Geeker ProTable demo still has known type issues." -ForegroundColor Yellow
  & corepack.cmd pnpm type:check
  if ($LASTEXITCODE -ne 0) {
    Write-Host "type:check did not fully pass. If errors are only in ProTable demo files, business development can continue." -ForegroundColor Yellow
  }
} else {
  Write-Step "Skip type check"
  Write-Host "Type check skipped."
}

Write-Step "How to use"
Write-Host "1. Start the frontend:"
Write-Host "   corepack pnpm dev"
Write-Host "2. If pnpm is not directly available in PowerShell, always use:"
Write-Host "   corepack pnpm <command>"
Write-Host "3. Default local URL:"
Write-Host "   http://localhost:8848"

Write-Step "Done"
Write-Host "Frontend environment setup script finished." -ForegroundColor Green
