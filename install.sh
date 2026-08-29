#!/usr/bin/env bash
set -e

echo "🛡️  Installing ZeroShield — Autonomous Cyber Engine..."

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is required (>= 18.0.0). Please install Node.js first: https://nodejs.org"
    exit 1
fi

echo "📦 Installing @zeroshield/cli globally via npm..."
npm install -g @zeroshield/cli

echo "✅ ZeroShield successfully installed!"
echo "🚀 Run 'zeroshield --help' or 'zeroshield scan .' to get started."
