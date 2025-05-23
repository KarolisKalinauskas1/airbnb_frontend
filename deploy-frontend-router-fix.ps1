# Script to deploy the frontend router fix to prevent redirection for camper detail pages

Write-Host "Starting deployment of frontend router fix..." -ForegroundColor Cyan

# Navigate to frontend directory
$frontendPath = "c:\Users\kkaro\OneDrive - Thomas More\SecondYear2nd\Web Programming\airbnb_for_camping\airbnb_frontend"
Set-Location $frontendPath

# Stage the changed file
Write-Host "Staging changes..." -ForegroundColor Yellow
git add frontend/src/router/index.js

# Commit changes
Write-Host "Committing router fix..." -ForegroundColor Yellow
git commit -m "Fix router guard to allow unauthenticated users to view camper detail pages"

# Deploy to Vercel (assuming that's where the frontend is deployed)
Write-Host "Deploying to Vercel..." -ForegroundColor Cyan
vercel --prod

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Please verify: non-logged-in users can now view camper detail pages without being redirected to login." -ForegroundColor White
