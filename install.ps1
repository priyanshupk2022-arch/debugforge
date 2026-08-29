# DebugForge Native Windows PowerShell Installer
Write-Host "🔥 Installing DebugForge: Autonomous AI Debugging Agent Harness..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Node.js 18+ is required. Please install Node.js first from https://nodejs.org/"
    exit 1
}

npm install -g @debugforge/cli

Write-Host "✅ DebugForge installed successfully!" -ForegroundColor Green
Write-Host "🚀 Run 'debugforge diagnose' or 'debugforge watch' to get started." -ForegroundColor Cyan
