const fs = require('fs');
const { execSync } = require('child_process');

// ==========================================================
// 1. VERCEL ESCAPE HATCH ☁️
// ==========================================================
if (process.env.VERCEL) {
  console.log('☁️ Vercel environment detected! Running standard web build...');
  execSync('npx next build', { stdio: 'inherit' });
  process.exit(0);
}

// ==========================================================
// 2. MOBILE CAPACITOR EXPORT 📱
// ==========================================================
console.log('📱 Mobile environment detected! Preparing static export...');

const proxyFile = './proxy.ts'; 
const proxyBackup = './proxy.ts.bak';

const routeFile = './app/auth/callback/route.ts';
const routeBackup = './app/auth/callback/route.ts.bak';

// 🔥 THE FIX: Use an underscore so Next.js completely ignores these folders!
const aiBioDir = './app/api/generate-bio';
const aiBioBackup = './app/api/_generate-bio';

const cronDir = './app/api/cron';
const cronBackup = './app/api/_cron';

// NEW: Hide the push notification route from mobile static export
const sendPushDir = './app/api/send-push';
const sendPushBackup = './app/api/_send-push';

// 🚨 SELF-HEALING (Also check for the old -hidden folders just in case)
if (fs.existsSync('./app/api/generate-bio-hidden')) fs.renameSync('./app/api/generate-bio-hidden', aiBioDir);
if (fs.existsSync('./app/api/cron-hidden')) fs.renameSync('./app/api/cron-hidden', cronDir);

if (fs.existsSync(proxyBackup) && !fs.existsSync(proxyFile)) fs.renameSync(proxyBackup, proxyFile);
if (fs.existsSync(routeBackup) && !fs.existsSync(routeFile)) fs.renameSync(routeBackup, routeFile);
if (fs.existsSync(aiBioBackup) && !fs.existsSync(aiBioDir)) fs.renameSync(aiBioBackup, aiBioDir);
if (fs.existsSync(cronBackup) && !fs.existsSync(cronDir)) fs.renameSync(cronBackup, cronDir);
if (fs.existsSync(sendPushBackup) && !fs.existsSync(sendPushDir)) fs.renameSync(sendPushBackup, sendPushDir);

console.log('🗑️ Clearing Next.js cache...');
fs.rmSync('.next', { recursive: true, force: true });

let buildFailed = false;

try {
  // 1. Temporarily hide the files
  if (fs.existsSync(proxyFile)) {
    fs.renameSync(proxyFile, proxyBackup);
    console.log('✅ Temporarily hiding proxy.ts...');
  }
  if (fs.existsSync(routeFile)) {
    fs.renameSync(routeFile, routeBackup);
    console.log('✅ Temporarily hiding auth route...');
  }
  if (fs.existsSync(aiBioDir)) {
    fs.renameSync(aiBioDir, aiBioBackup);
    console.log('✅ Temporarily hiding AI Bio route...');
  }
  if (fs.existsSync(cronDir)) {
    fs.renameSync(cronDir, cronBackup);
    console.log('✅ Temporarily hiding Cron route...');
  }
  if (fs.existsSync(sendPushDir)) {
    fs.renameSync(sendPushDir, sendPushBackup);
    console.log('✅ Temporarily hiding send-push route...');
  }

  // 2. Run the Next.js static build
  console.log('🚀 Running mobile static build...\n');
  
  execSync('npx next build', { 
    stdio: 'inherit',
    env: { ...process.env, MOBILE_BUILD: 'true' }
  });

} catch (error) {
  console.error('\n❌ Build failed! Here is the actual Next.js error:');
  
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  console.error(error.message);
  
  buildFailed = true; 
} finally {
  // 3. Always restore the files
  if (fs.existsSync(proxyBackup)) {
    fs.renameSync(proxyBackup, proxyFile);
    console.log('✅ proxy.ts restored!');
  }
  if (fs.existsSync(routeBackup)) {
    fs.renameSync(routeBackup, routeFile);
    console.log('✅ auth route restored!');
  }
  if (fs.existsSync(aiBioBackup)) {
    fs.renameSync(aiBioBackup, aiBioDir);
    console.log('✅ AI Bio route restored!');
  }
  if (fs.existsSync(cronBackup)) {
    fs.renameSync(cronBackup, cronDir);
    console.log('✅ Cron route restored!');
  }
  if (fs.existsSync(sendPushBackup)) {
    fs.renameSync(sendPushBackup, sendPushDir);
    console.log('✅ send-push route restored!');
  }

  if (buildFailed) process.exit(1);
}