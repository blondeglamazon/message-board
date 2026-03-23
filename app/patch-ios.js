const fs = require('fs');
const path = require('path');

console.error('🚀 RUNNING ALAMOFIRE & CAPGO PATCHES 🚀');

try {
  const pluginDir = path.join(__dirname, 'node_modules', '@capgo', 'capacitor-social-login');
  
  // Patch Capgo's internal script
  const configScript = path.join(pluginDir, 'scripts', 'configure-dependencies.js');
  if (fs.existsSync(configScript)) {
    let content = fs.readFileSync(configScript, 'utf8');
    content = content.replace(/5\.11\.0/g, '5.10.0').replace(/6\.0\.0/g, '5.11.0');
    fs.writeFileSync(configScript, content);
    console.error('✅ SUCCESS: Hijacked Capgo configure-dependencies.js');
  }

  // Patch Package.swift directly
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