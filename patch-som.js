const fs = require('fs');
const path = require('path');

// CROSS-PLATFORM CHECK: Only run on macOS (Appflow)
if (process.platform !== 'darwin') {
  console.log('✅ Not on macOS. Skipping native iOS patches.');
  process.exit(0);
}

console.error('🚀 RUNNING SWIFT PACKAGE PATCH 🚀');

try {
  const pluginDir = path.join(__dirname, 'node_modules', '@capgo', 'capacitor-app-tracking-transparency');
  
  if (!fs.existsSync(pluginDir)) {
    console.error('Plugin directory not found. Skipping.');
    process.exit(0);
  }

  // 1. Patch Package.swift
  const spmFile = path.join(pluginDir, 'Package.swift');
  if (fs.existsSync(spmFile)) {
    let content = fs.readFileSync(spmFile, 'utf8');
    content = content.replace(/8\.0\.0/g, '7.0.0'); // Force Capacitor 7
    fs.writeFileSync(spmFile, content);
    console.error('✅ SUCCESS: Patched Package.swift to Capacitor 7');
  }

  // 2. Patch any Podspec files just to be perfectly safe
  const files = fs.readdirSync(pluginDir);
  for (const file of files) {
    if (file.endsWith('.podspec')) {
      const podspecPath = path.join(pluginDir, file);
      let content = fs.readFileSync(podspecPath, 'utf8');
      content = content.replace(/8\.0\.0/g, '7.0.0'); // Force Capacitor 7
      fs.writeFileSync(podspecPath, content);
      console.error(`✅ SUCCESS: Patched ${file} to Capacitor 7`);
    }
  }
} catch (e) {
  console.error('❌ ERROR: ' + e.message);
}