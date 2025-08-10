#!/bin/bash

# Fix Flutter SDK Installation Script
# This script fixes the Flutter SDK version issue

echo "🔧 Fixing Flutter SDK Installation..."

cd mobile

# Remove existing Flutter installation
echo "📦 Removing existing Flutter installation..."
rm -rf flutter flutter.tar.xz

# Download proper Flutter SDK (stable version)
echo "⬇️ Downloading Flutter SDK 3.16.0 (stable)..."
wget -q https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.16.0-stable.tar.xz

# Extract Flutter SDK
echo "📂 Extracting Flutter SDK..."
tar xf flutter_linux_3.16.0-stable.tar.xz

# Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 flutter/

# Add to PATH temporarily
export PATH="$PATH:$(pwd)/flutter/bin"

# Configure git safe directory
echo "🔧 Configuring git safe directory..."
git config --global --add safe.directory "$(pwd)/flutter"

# Disable analytics
echo "📊 Disabling Flutter analytics..."
flutter config --no-analytics

# Run Flutter doctor
echo "🩺 Running Flutter doctor..."
flutter doctor

# Install dependencies
echo "📦 Installing Flutter dependencies..."
flutter pub get

echo "✅ Flutter SDK installation completed!"
echo ""
echo "To use Flutter in this session, run:"
echo "export PATH=\"\$PATH:$(pwd)/flutter/bin\""
echo ""
echo "To make it permanent, add this line to your ~/.bashrc or ~/.zshrc:"
echo "export PATH=\"\$PATH:$(pwd)/flutter/bin\""