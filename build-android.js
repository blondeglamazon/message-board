const fs = require('fs');
const { execSync } = require('child_process');

// The files we need to hide from the mobile static build
const proxyFile = './proxy.ts'; 
const proxyBackup = './proxy.ts.bak';

const routeFile = './app/auth/callback/route.ts';
const routeBackup = './app/auth/callback/route.ts.bak';

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

  // 2. Run the Next.js static build
  console.log('🚀 Running mobile static build...');
  execSync('npx next build', { stdio: 'inherit' });

} catch (error) {
  console.error('\n❌ Build failed or was canceled.');
} finally {
  // 3. Always restore the files so Vercel doesn't break!
  if (fs.existsSync(proxyBackup)) {
    fs.renameSync(proxyBackup, proxyFile);
    console.log('✅ proxy.ts has been safely restored for Vercel!');
  }
  
  if (fs.existsSync(routeBackup)) {
    fs.renameSync(routeBackup, routeFile);
    console.log('✅ auth/callback/route.ts has been safely restored for Vercel!');
  }
}