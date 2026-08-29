Write-Host "🛡️  Installing ZeroShield for Windows (native PowerShell)..." -ForegroundColor Cyan

# Verify Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is required (>= 18.0.0). Please install Node.js first: https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing @zeroshield/cli globally via npm..." -ForegroundColor Yellow
npm install -g @zeroshield/cli

Write-Host "✅ ZeroShield successfully installed!" -ForegroundColor Green
Write-Host "🚀 Run 'zeroshield --help' or 'zeroshield scan .' to get started." -ForegroundColor Cyan
