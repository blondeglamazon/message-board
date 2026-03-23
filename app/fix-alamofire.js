const fs = require('fs');
const path = require('path');

console.error('🚀 RUNNING ALAMOFIRE SPM PATCH 🚀');

try {
  // Bypass Node 22 strict exports by hardcoding the exact directory path
  const pluginDir = path.join(__dirname, 'node_modules', '@capgo', 'capacitor-social-login');
  const spmFile = path.join(pluginDir, 'Package.swift');
  
  if (fs.existsSync(spmFile)) {
    let content = fs.readFileSync(spmFile, 'utf8');
    
    // Aggressively match the Alamofire line and force it to be EXACTLY 5.10.2
    content = content.replace(
      /(https:\/\/github\.com\/Alamofire\/Alamofire\.git"?[,\s]*)([^)]+)/g, 
      '$1.exact("5.10.2")'
    );
    
    fs.writeFileSync(spmFile, content);
    console.error('✅ SUCCESS: Forced Alamofire to .exact("5.10.2") in Package.swift');
  } else {
    console.error('❌ ERROR: Package.swift not found at ' + spmFile);
  }
} catch (e) {
  console.error('❌ CRITICAL SCRIPT ERROR: ' + e.message);
}