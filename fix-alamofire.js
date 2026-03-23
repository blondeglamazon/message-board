const fs = require('fs');
const path = require('path');

console.error('🚀 RUNNING UNIVERSAL BUILD HACKS 🚀');

try {
  // --- HACK 1: BYPASS CAPACITOR NODE 22 CHECK ---
  const capBin = path.join(__dirname, 'node_modules', '@capacitor', 'cli', 'bin', 'capacitor');
  if (fs.existsSync(capBin)) {
    let capContent = fs.readFileSync(capBin, 'utf8');
    // Capacitor strictly checks for Node 22. We lower the requirement to Node 20.
    capContent = capContent.replace(/< 22/g, '< 20');
    capContent = capContent.replace(/>=22\.0\.0/g, '>=20.0.0');
    fs.writeFileSync(capBin, capContent);
    console.error('✅ SUCCESS: Bypassed Capacitor Node 22 requirement.');
  }

  // --- HACK 2: SABOTAGE CAPGO ALAMOFIRE SCRIPT ---
  const pluginDir = path.join(__dirname, 'node_modules', '@capgo', 'capacitor-social-login');
  const configScript = path.join(pluginDir, 'scripts', 'configure-dependencies.js');
  if (fs.existsSync(configScript)) {
    let content = fs.readFileSync(configScript, 'utf8');
    content = content.replace(/5\.11\.0/g, '5.10.0');
    content = content.replace(/6\.0\.0/g, '5.11.0');
    fs.writeFileSync(configScript, content);
    console.error('✅ SUCCESS: Hijacked Capgo configure-dependencies.js.');
  }

  // --- HACK 3: PATCH PACKAGE.SWIFT DIRECTLY ---
  const spmFile = path.join(pluginDir, 'Package.swift');
  if (fs.existsSync(spmFile)) {
    let content = fs.readFileSync(spmFile, 'utf8');
    content = content.replace(/5\.11\.0/g, '5.10.0');
    content = content.replace(/6\.0\.0/g, '5.11.0');
    fs.writeFileSync(spmFile, content);
    console.error('✅ SUCCESS: Patched Package.swift directly.');
  }

} catch (e) {
  console.error('❌ CRITICAL SCRIPT ERROR: ' + e.message);
}