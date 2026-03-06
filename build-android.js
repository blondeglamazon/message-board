const fs = require('fs');
const { execSync } = require('child_process');

const targetFile = './proxy.ts'; 
const backupFile = './proxy.ts.bak';

try {
  // 1. Temporarily hide the file
  if (fs.existsSync(targetFile)) {
    fs.renameSync(targetFile, backupFile);
    console.log('✅ Temporarily hiding proxy.ts from Next.js...');
  }

  // 2. Run the Next.js static build
  console.log('🚀 Running Android static build...');
  execSync('npx next build', { stdio: 'inherit' });

} catch (error) {
  console.error('\n❌ Build failed or was canceled.');
} finally {
  // 3. Always restore the file
  if (fs.existsSync(backupFile)) {
    fs.renameSync(backupFile, targetFile);
    console.log('✅ proxy.ts has been safely restored for Vercel!');
  }
}