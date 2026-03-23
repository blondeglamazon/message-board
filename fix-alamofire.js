const fs = require('fs');
const path = require('path');

console.error('🚀 RUNNING UNIVERSAL BUILD HACKS 🚀');

try {
  // --- HACK 1: BYPASS CAPACITOR NODE 22 CHECK ---
  const capBin = path.join(__dirname, 'node_modules', '@capacitor', 'cli', 'bin', 'capacitor');
  if (fs.existsSync(capBin)) {
    let capContent = fs.readFileSync(capBin, 'utf8');
    capContent = capContent.replace(/< 22/g, '< 20');
    capContent = capContent.replace(/>=22\.0\.0/g, '>=20.0.0');
    fs.writeFileSync(capBin, capContent);
    console.error('✅ SUCCESS: Bypassed Capacitor Node 22 requirement in bin/capacitor.');
  }

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
      }
    }
  }

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
          }
        } catch (e) {}
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

  // --- HACK 4: WRAP CAPACITOR CLI TO FIX CAPACITOR 8.1.0 SWIFT BUG ---
  const npxCapBin = path.join(__dirname, 'node_modules', '.bin', 'cap');
  if (fs.existsSync(npxCapBin) && fs.existsSync(capBin)) {
    const wrapperScript = `#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const result = spawnSync(process.execPath, ['${capBin}', ...args], { stdio: 'inherit' });

// ONLY RUN THIS HACK IF 'SYNC' OR 'UPDATE' WAS JUST CALLED
if (args.includes('sync') || args.includes('update')) {
  console.error('🚀 CAP SYNC FINISHED - RUNNING POST-SYNC HACKS 🚀');
  const appSpmFile = path.join(process.cwd(), 'ios', 'App', 'CapApp-SPM', 'Package.swift');
  if (fs.existsSync(appSpmFile)) {
    let content = fs.readFileSync(appSpmFile, 'utf8');
    const lines = content.split('\\n');
    const newLines = lines.map(line => {
      if (line.includes('capacitor-swift-pm')) {
        // Force the broken 8.1.x version back to the stable 8.0.0
        return line.replace(/from:\\s*["']8\\.\\d+\\.\\d+["']/g, 'exact: "8.0.0"')
                   .replace(/branch:\\s*["']main["']/g, 'exact: "8.0.0"');
      }
      return line;
    });
    fs.writeFileSync(appSpmFile, newLines.join('\\n'));
    console.error('✅ SUCCESS: Forced capacitor-swift-pm to exact 8.0.0 to fix Swift compiler bug.');
  }
}
process.exit(result.status ?? 1);
`;
    // Replace the CLI symlink with our wrapper script so we can intercept npx cap sync
    try { fs.unlinkSync(npxCapBin); } catch(e) {}
    fs.writeFileSync(npxCapBin, wrapperScript);
    fs.chmodSync(npxCapBin, 0o755);
    console.error('✅ SUCCESS: Wrapped Capacitor CLI to patch SPM post-sync.');
  }

} catch (e) {
  console.error('❌ CRITICAL SCRIPT ERROR: ' + e.message);
}