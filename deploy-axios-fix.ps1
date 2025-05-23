# Deploy this script using PowerShell to apply the axios interceptor fix
# May 23, 2025

# Set error action preference to stop on error
$ErrorActionPreference = "Stop"

Write-Host "Starting deployment of Axios Interceptor Fix for Camping Spot Detail Access..." -ForegroundColor Green

# Navigate to the frontend directory
$frontendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $frontendDir

# Build the frontend with the fixes
Write-Host "Building the frontend with axios interceptor fixes..." -ForegroundColor Cyan
cd frontend
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed! Aborting deployment." -ForegroundColor Red
    exit 1
}
Write-Host "Frontend build successful!" -ForegroundColor Green

# Use existing deployment script if available
if (Test-Path "..\deploy-critical-fixes.ps1") {
    Write-Host "Running main deployment script..." -ForegroundColor Cyan
    & "..\deploy-critical-fixes.ps1"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Deployment failed! Please check the deployment script and try again." -ForegroundColor Red
        exit 1
    }
    Write-Host "Deployment through main script successful!" -ForegroundColor Green
} 
# Deploy to Vercel directly if main script not available
elseif (Test-Path "vercel.json") {
    Write-Host "Deploying to Vercel..." -ForegroundColor Cyan
    vercel --prod
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Vercel deployment failed! Please check your Vercel configuration and try again." -ForegroundColor Red
        exit 1
    }
    Write-Host "Vercel deployment successful!" -ForegroundColor Green
}

# Move back to the parent directory
cd ..

Write-Host "Axios Interceptor Fix for Camping Spot Detail Access has been successfully deployed!" -ForegroundColor Green
Write-Host "Fix documentation available in: AXIOS-INTERCEPTOR-FIX.md" -ForegroundColor Cyan
