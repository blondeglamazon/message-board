const fs = require('fs');
const path = require('path'); // 👈 ADDED THIS!
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

const referralDir = path.join(__dirname, 'app', 'api', 'referral');
const referralBackup = path.join(__dirname, 'app', 'api', '_referral_hidden');

const checkoutDir = path.join(__dirname, 'app', 'api', 'checkout');
const checkoutBackup = path.join(__dirname, 'app', 'api', '_checkout_hidden');

const webhooksDir = path.join(__dirname, 'app', 'api', 'webhooks');
const webhooksBackup = path.join(__dirname, 'app', 'api', '_webhooks_hidden');

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

// 🚨 SELF-HEALING FOR NEW ROUTES
if (fs.existsSync(referralBackup) && !fs.existsSync(referralDir)) fs.renameSync(referralBackup, referralDir);
if (fs.existsSync(checkoutBackup) && !fs.existsSync(checkoutDir)) fs.renameSync(checkoutBackup, checkoutDir);
if (fs.existsSync(webhooksBackup) && !fs.existsSync(webhooksDir)) fs.renameSync(webhooksBackup, webhooksDir);

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
  
  // NEW: Hide the dynamic monetization routes
  if (fs.existsSync(referralDir)) {
    fs.renameSync(referralDir, referralBackup);
    console.log('✅ Temporarily hiding referral route...');
  }
  if (fs.existsSync(checkoutDir)) {
    fs.renameSync(checkoutDir, checkoutBackup);
    console.log('✅ Temporarily hiding checkout route...');
  }
  if (fs.existsSync(webhooksDir)) {
    fs.renameSync(webhooksDir, webhooksBackup);
    console.log('✅ Temporarily hiding webhooks route...');
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

  // 👈 ADDED THE RESTORATION LOGIC HERE
  if (fs.existsSync(referralBackup)) {
    fs.renameSync(referralBackup, referralDir);
    console.log('✅ referral route restored!');
  }
  if (fs.existsSync(checkoutBackup)) {
    fs.renameSync(checkoutBackup, checkoutDir);
    console.log('✅ checkout route restored!');
  }
  if (fs.existsSync(webhooksBackup)) {
    fs.renameSync(webhooksBackup, webhooksDir);
    console.log('✅ webhooks route restored!');
  }

  if (buildFailed) process.exit(1);
}