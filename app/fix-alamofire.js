const fs = require('fs');
const path = require('path');

try {
  // 1. Find the exact folder dynamically 
  const pluginPkg = require.resolve('@capgo/capacitor-social-login/package.json');
  const pluginDir = path.dirname(pluginPkg);

  // 2. Force the hard ceiling in Package.swift
  const spmFile = path.join(pluginDir, 'Package.swift');
  if (fs.existsSync(spmFile)) {
    let content = fs.readFileSync(spmFile, 'utf8');
    // Finds the entire Alamofire package line and strictly caps it below 5.11.0
    content = content.replace(/\.package\([^)]+Alamofire[^)]+\)/gi, '.package(url: "https://github.com/Alamofire/Alamofire.git", "5.10.0"..<"5.11.0")');
    fs.writeFileSync(spmFile, content);
    console.log('✅ SUCCESS: Forced Alamofire to < 5.11.0 in Package.swift');
  }

  // 3. Force the hard ceiling in Podspec
  const podFile = path.join(pluginDir, 'CapgoCapacitorSocialLogin.podspec');
  if (fs.existsSync(podFile)) {
    let content = fs.readFileSync(podFile, 'utf8');
    content = content.replace(/s\.dependency\s+['"]Alamofire['"].*/gi, 's.dependency \'Alamofire\', \'>= 5.0.0\', \'< 5.11.0\'');
    fs.writeFileSync(podFile, content);
    console.log('✅ SUCCESS: Forced Alamofire to < 5.11.0 in Podspec');
  }
} catch (e) {
  console.log('❌ ERROR PATCHING ALAMOFIRE: ' + e.message);
}