const fs = require('fs');
const { execSync } = require('child_process');

// ==========================================================
// 1. VERCEL ESCAPE HATCH ☁️
// ==========================================================
// If Vercel is building the website, run standard Next.js and exit so the API stays intact!
if (process.env.VERCEL) {
  console.log('☁️ Vercel environment detected! Running standard web build...');
  execSync('npx next build', { stdio: 'inherit' });
  process.exit(0);
}

// ==========================================================
// 2. MOBILE CAPACITOR EXPORT 📱 (Appflow & Local)
// ==========================================================
console.log('📱 Mobile environment detected! Preparing static export...');

console.log('🗑️ Clearing Next.js cache...');
fs.rmSync('.next', { recursive: true, force: true });

// The files and folders we need to hide from the mobile static build
const proxyFile = './proxy.ts'; 
const proxyBackup = './proxy.ts.bak';

const routeFile = './app/auth/callback/route.ts';
const routeBackup = './app/auth/callback/route.ts.bak';

const apiDir = './app/api';
// Using an underscore tells Next.js to completely ignore this folder!
const apiBackup = './app/_api'; 

try {
  // 1. Temporarily hide the files
  if (fs.existsSync(proxyFile)) {
    fs.renameSync(proxyFile, proxyBackup);
    console.log('✅ Temporarily hiding proxy.ts from Next.js...');
  }
  
  if (fs.existsSync(routeFile)) {
    fs.renameSync(routeFile, routeBackup);
    console.log('✅ Temporarily hiding auth/callback/route.ts from Next.js...');
  }

  // Hide the API folder so Next.js doesn't try to build server code for the phone
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, apiBackup);
    console.log('✅ Temporarily hiding api folder from Next.js...');
  }

  // 2. Run the Next.js static build
  console.log('🚀 Running mobile static build...');
  
  // ✅ THE FIX: We inject 'MOBILE_BUILD: true' so next.config.js knows to activate output: 'export'!
  execSync('npx next build', { 
    stdio: 'inherit',
    env: { ...process.env, MOBILE_BUILD: 'true' }
  });

} catch (error) {
  console.error('\n❌ Build failed or was canceled.');
  process.exit(1); // ✅ Tells Appflow the build actually failed so it doesn't blindly continue
} finally {
  // 3. Always restore the files so Vercel/Local dev doesn't break!
  if (fs.existsSync(proxyBackup)) {
    fs.renameSync(proxyBackup, proxyFile);
    console.log('✅ proxy.ts has been safely restored for Vercel!');
  }
  
  if (fs.existsSync(routeBackup)) {
    fs.renameSync(routeBackup, routeFile);
    console.log('✅ auth/callback/route.ts has been safely restored for Vercel!');
  }

  if (fs.existsSync(apiBackup)) {
    fs.renameSync(apiBackup, apiDir);
    console.log('✅ api folder has been safely restored for Vercel!');
  }
}