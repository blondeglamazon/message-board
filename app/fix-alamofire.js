const fs = require('fs');

const files = [
  'node_modules/@capgo/capacitor-social-login/Package.swift',
  'node_modules/@capgo/capacitor-social-login/scripts/configure-dependencies.js',
  'node_modules/@capgo/capacitor-social-login/CapgoCapacitorSocialLogin.podspec'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Force SPM to stop before 5.11.0
    content = content.replace(/\.upToNextMajor\(from:\s*["']5\.\d+\.\d+["']\)/g, '"5.10.0"..<"5.11.0"');
    content = content.replace(/["']?5\.\d+\.\d+["']?\s*\.\.<\s*["']?6\.0\.0["']?/g, '"5.10.0"..<"5.11.0"');
    
    // Force CocoaPods to use 5.10.2
    content = content.replace(/~>\s*5\.\d+\.\d+/g, '~> 5.10.2');
    
    // Catch-all
    content = content.replace(/5\.11\.0/g, '5.10.0');

    fs.writeFileSync(file, content);
    console.log('✅ Safely locked Alamofire to v5.10 in ' + file);
  }
});