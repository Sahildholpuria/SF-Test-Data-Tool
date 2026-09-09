#!/usr/bin/env bash
# SF DataForge - Production Chrome Web Store Packaging Script
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

VERSION=$(grep '"version"' manifest.json | head -1 | awk -F'"' '{print $4}')
ZIP_NAME="dist/sf-dataforge-v${VERSION}.zip"

mkdir -p dist

echo "📦 Packaging SF DataForge v${VERSION} for Chrome Web Store..."

# Remove old zip if present
rm -f "$ZIP_NAME"

# Create clean production zip
zip -r "$ZIP_NAME" \
  manifest.json \
  background.js \
  popup.html \
  popup.css \
  popup.js \
  icons/ \
  src/ \
  -x "*.DS_Store" \
  -x "__MACOSX*" \
  -x "*.git*"

echo "✅ Package created successfully: $ZIP_NAME"
echo "📊 Package size: $(ls -lh "$ZIP_NAME" | awk '{print $5}')"
