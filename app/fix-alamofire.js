const fs = require('fs');
const path = require('path');

function patchPlugin(pluginDir) {
  const spmFile = path.join(pluginDir, 'Package.swift');
  if (fs.existsSync(spmFile)) {
    let content = fs.readFileSync(spmFile, 'utf8');
    const original = content;
    
    // Aggressively match the Alamofire line and force it to be strictly less than 5.11.0
    content = content.replace(/(\.package\s*\(\s*url:\s*["'][^"']+Alamofire[^"']+["']\s*,)([^)]+)(\))/gi, '$1 "5.0.0"..<"5.11.0"$3');
    
    if (original !== content) {
      fs.writeFileSync(spmFile, content);
      console.error('✅ SUCCESS: Forced Alamofire to < 5.11.0 in Package.swift');
    }
  }

  const podFile = path.join(pluginDir, 'CapgoCapacitorSocialLogin.podspec');
  if (fs.existsSync(podFile)) {
    let content = fs.readFileSync(podFile, 'utf8');
    const original = content;
    
    content = content.replace(/(s\.dependency\s+["']Alamofire["']).*/gi, '$1, ">= 5.0.0", "< 5.11.0"');
    
    if (original !== content) {
      fs.writeFileSync(podFile, content);
      console.error('✅ SUCCESS: Forced Alamofire to < 5.11.0 in Podspec');
    }
  }
}

// Target the specific plugin
patchPlugin(path.join(__dirname, 'node_modules', '@capgo', 'capacitor-social-login'));