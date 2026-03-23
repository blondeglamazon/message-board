const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

if (process.platform === 'darwin') {
  console.log('🚀 macOS detected. Injecting Node 22 and patching Alamofire...');
  
  try {
    // 1. Inject Node 22 (Uses -U to safely overwrite the engine while running)
    execSync('curl -fsSL https://nodejs.org/dist/v22.14.0/node-v22.14.0-darwin-arm64.tar.gz | tar -xzU -C $(dirname $(dirname $(which node))) --strip-components=1', { stdio: 'inherit' });
    console.log('✅ Node 22 injected successfully.');
    
    // 2. Patch Alamofire in Capgo plugin
    const pluginDir = path.join(__dirname, 'node_modules', '@capgo', 'capacitor-social-login');
    const spmFile = path.join(pluginDir, 'Package.swift');
    
    if (fs.existsSync(spmFile)) {
      let content = fs.readFileSync(spmFile, 'utf8');
      
      // Matches the Alamofire URL and whatever version rule follows it, forcing it to be EXACTLY 5.10.2
      content = content.replace(
        /(https:\/\/github\.com\/Alamofire\/Alamofire\.git"?[,\s]*)[^)]+\)/gi, 
        '$1.exact("5.10.2")'
      );
      
      fs.writeFileSync(spmFile, content);
      console.log('✅ SUCCESS: Forced Alamofire to .exact("5.10.2") in Package.swift');
    } else {
      console.log('❌ ERROR: Package.swift not found at ' + spmFile);
    }

  } catch (e) {
    console.error('❌ CRITICAL SCRIPT ERROR: ' + e.message);
  }
} else {
  console.log('✅ Linux detected. Skipping macOS specific patches for Vercel.');
}