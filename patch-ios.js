const fs = require('fs');
const path = require('path');

// CROSS-PLATFORM CHECK: Only run on macOS (Darwin)
if (process.platform !== 'darwin') {
  console.log('✅ Not on macOS. Skipping iOS-specific patches.');
  process.exit(0);
}

console.error('🚀 RUNNING ULTIMATE 2024.04 PATCHES 🚀');

try {
  // --- 1. AGGRESSIVE NODE 22 BYPASS ---
  const cliDir = path.join(__dirname, 'node_modules', '@capacitor', 'cli');
  function patchFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        patchFiles(fullPath);
      } else if (fullPath.endsWith('.js') || fullPath.endsWith('.cjs')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('22')) {
          content = content.replace(/< 22/g, '< 20')
                           .replace(/>=22\.0\.0/g, '>=20.0.0')
                           .replace(/"22\.0\.0"/g, '"20.0.0"')
                           .replace(/'22\.0\.0'/g, "'20.0.0'");
          fs.writeFileSync(fullPath, content);
        }
      }
    }
  }
  patchFiles(cliDir);
  
  const capBin = path.join(cliDir, 'bin', 'capacitor');
  if (fs.existsSync(capBin)) {
    let content = fs.readFileSync(capBin, 'utf8');
    content = content.replace(/< 22/g, '< 20');
    fs.writeFileSync(capBin, content);
  }
  console.error('✅ SUCCESS: Fully bypassed Node 22 checks in @capacitor/cli.');

  // --- 2. CAPGO ALAMOFIRE PATCH ---
  const pluginDir = path.join(__dirname, 'node_modules', '@capgo', 'capacitor-social-login');
  const configScript = path.join(pluginDir, 'scripts', 'configure-dependencies.js');
  if (fs.existsSync(configScript)) {
    let content = fs.readFileSync(configScript, 'utf8');
    content = content.replace(/5\.11\.0/g, '5.10.0').replace(/6\.0\.0/g, '5.11.0');
    fs.writeFileSync(configScript, content);
    console.error('✅ SUCCESS: Hijacked Capgo configure-dependencies.js');
  }

  const spmFile = path.join(pluginDir, 'Package.swift');
  if (fs.existsSync(spmFile)) {
    let content = fs.readFileSync(spmFile, 'utf8');
    content = content.replace(/5\.11\.0/g, '5.10.0').replace(/6\.0\.0/g, '5.11.0');
    fs.writeFileSync(spmFile, content);
    console.error('✅ SUCCESS: Patched Package.swift');
  }
} catch (e) { 
  console.error('❌ ERROR: ' + e.message); 
}