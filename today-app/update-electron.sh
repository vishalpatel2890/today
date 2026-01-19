#!/bin/bash

cd /Users/vishalpatel/Documents/apps/to-do/today-app

echo "🛑 Stopping Today app..."
pkill -f "Today" 2>/dev/null
sleep 1

echo "📦 Building Electron app..."
npm run package

echo "🚀 Installing to /Applications..."
rm -rf /Applications/Today.app
cp -R release/mac-universal/Today.app /Applications/

echo "✅ Opening updated app..."
open /Applications/Today.app

echo "🎉 Done!"
