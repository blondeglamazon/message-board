const fs = require('fs');
const path = require('path');

console.error('🚀 RUNNING CAPGO SABOTAGE PATCH 🚀');

try {
  const pluginDir = path.join(__dirname, 'node_modules', '@capgo', 'capacitor-social-login');
  
  // 1. Sabotage Capgo's own configuration script so it injects the safe version!
  const configScript = path.join(pluginDir, 'scripts', 'configure-dependencies.js');
  if (fs.existsSync(configScript)) {
    let content = fs.readFileSync(configScript, 'utf8');
    // Globally replace 5.11.0 with 5.10.0 inside the script itself
    content = content.replace(/5\.11\.0/g, '5.10.0');
    content = content.replace(/6\.0\.0/g, '5.11.0');
    fs.writeFileSync(configScript, content);
    console.error('✅ SUCCESS: Hijacked Capgo configure-dependencies.js');
  }

  // 2. Patch Package.swift directly just in case
  const spmFile = path.join(pluginDir, 'Package.swift');
  if (fs.existsSync(spmFile)) {
    let content = fs.readFileSync(spmFile, 'utf8');
    content = content.replace(/5\.11\.0/g, '5.10.0');
    content = content.replace(/6\.0\.0/g, '5.11.0');
    fs.writeFileSync(spmFile, content);
    console.error('✅ SUCCESS: Patched Package.swift directly');
  }

} catch (e) {
  console.error('❌ CRITICAL SCRIPT ERROR: ' + e.message);
}