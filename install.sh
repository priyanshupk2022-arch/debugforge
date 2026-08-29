#!/usr/bin/env bash
set -e

echo "🔥 Installing DebugForge: Autonomous AI Debugging Agent Harness..."

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js 18+ is required. Please install Node.js first."
  exit 1
fi

npm install -g @debugforge/cli

echo "✅ DebugForge installed successfully!"
echo "🚀 Run 'debugforge diagnose' or 'debugforge watch' to get started."
