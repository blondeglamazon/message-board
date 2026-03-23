const fs = require('fs');
const path = require('path');

// CROSS-PLATFORM CHECK: Only run on macOS (Appflow)
if (process.platform !== 'darwin') {
  console.log('✅ Not on macOS. Skipping native iOS patches.');
  process.exit(0);
}

console.error('🚀 RUNNING SWIFT PACKAGE PATCHES 🚀');

try {
  // --- 1. APP TRACKING TRANSPARENCY PATCH ---
  const trackingDir = path.join(__dirname, 'node_modules', '@capgo', 'capacitor-app-tracking-transparency');
  if (fs.existsSync(trackingDir)) {
    const trackingSpm = path.join(trackingDir, 'Package.swift');
    if (fs.existsSync(trackingSpm)) {
      let content = fs.readFileSync(trackingSpm, 'utf8');
      content = content.replace(/8\.0\.0/g, '7.0.0');
      fs.writeFileSync(trackingSpm, content);
      console.error('✅ SUCCESS: Patched Tracking Package.swift to Capacitor 7');
    }
    
    const files = fs.readdirSync(trackingDir);
    for (const file of files) {
      if (file.endsWith('.podspec')) {
        const podspecPath = path.join(trackingDir, file);
        let content = fs.readFileSync(podspecPath, 'utf8');
        content = content.replace(/8\.0\.0/g, '7.0.0');
        fs.writeFileSync(podspecPath, content);
      }
    }
  }

  // --- 2. FACEBOOK SDK DOWNGRADE PATCH ---
  const socialDir = path.join(__dirname, 'node_modules', '@capgo', 'capacitor-social-login');
  if (fs.existsSync(socialDir)) {
    const socialSpm = path.join(socialDir, 'Package.swift');
    if (fs.existsSync(socialSpm)) {
      let content = fs.readFileSync(socialSpm, 'utf8');
      // Force Facebook SDK to exact version 17.0.0 (Xcode 15 compatible)
      content = content.replace(/(https:\/\/github\.com\/facebook\/facebook-ios-sdk\.git"?[,\s]*)[^)]+\)/gi, '$1.exact("17.0.0")');
      fs.writeFileSync(socialSpm, content);
      console.error('✅ SUCCESS: Locked Facebook SDK to 17.0.0 for Xcode 15 compatibility');
    }
  }

} catch (e) {
  console.error('❌ ERROR: ' + e.message);
}