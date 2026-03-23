const fs = require('fs');
const path = require('path');

console.error('🚀 RUNNING UNIVERSAL BUILD HACKS 🚀');

try {
  // --- HACK 1: BYPASS CAPACITOR NODE 22 CHECK ---
  // Patch BOTH the bin/capacitor entry point AND the compiled JS that checks the version.
  // Appflow's Fastlane calls `npx cap config` directly, which re-checks the version.
  const capBin = path.join(__dirname, 'node_modules', '@capacitor', 'cli', 'bin', 'capacitor');
  if (fs.existsSync(capBin)) {
    let capContent = fs.readFileSync(capBin, 'utf8');
    capContent = capContent.replace(/< 22/g, '< 20');
    capContent = capContent.replace(/>=22\.0\.0/g, '>=20.0.0');
    fs.writeFileSync(capBin, capContent);
    console.error('✅ SUCCESS: Bypassed Capacitor Node 22 requirement in bin/capacitor.');
  }

  // Also patch the dist CLI files where the version check may live
  const cliDistPaths = [
    path.join(__dirname, 'node_modules', '@capacitor', 'cli', 'dist', 'index.js'),
    path.join(__dirname, 'node_modules', '@capacitor', 'cli', 'dist', 'index.cjs'),
    path.join(__dirname, 'node_modules', '@capacitor', 'cli', 'dist', 'cli.js'),
    path.join(__dirname, 'node_modules', '@capacitor', 'cli', 'dist', 'config.js'),
  ];
  for (const distPath of cliDistPaths) {
    if (fs.existsSync(distPath)) {
      let content = fs.readFileSync(distPath, 'utf8');
      if (content.includes('22.0.0') || content.includes('22')) {
        content = content.replace(/>=22\.0\.0/g, '>=20.0.0');
        content = content.replace(/NodeJS >=22\.0\.0/g, 'NodeJS >=20.0.0');
        content = content.replace(/"22\.0\.0"/g, '"20.0.0"');
        content = content.replace(/'22\.0\.0'/g, "'20.0.0'");
        fs.writeFileSync(distPath, content);
        console.error(`✅ SUCCESS: Patched Node version check in ${path.basename(distPath)}`);
      }
    }
  }

  // Recursively find and patch any file in @capacitor/cli that contains the version gate
  const cliDir = path.join(__dirname, 'node_modules', '@capacitor', 'cli');
  function patchDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        patchDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.cjs') || entry.name.endsWith('.mjs'))) {
        try {
          let content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('>=22.0.0') || content.includes('"22.0.0"') || content.includes("'22.0.0'")) {
            content = content.replace(/>=22\.0\.0/g, '>=20.0.0');
            content = content.replace(/"22\.0\.0"/g, '"20.0.0"');
            content = content.replace(/'22\.0\.0'/g, "'20.0.0'");
            fs.writeFileSync(fullPath, content);
            console.error(`✅ SUCCESS: Patched ${path.relative(cliDir, fullPath)}`);
          }
        } catch (e) { /* skip binary/unreadable files */ }
      }
    }
  }
  patchDir(cliDir);

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