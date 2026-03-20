const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('======================================');
console.log('🚀 MOBILE BUILD SCRIPT STARTING 🚀');
console.log('======================================');

// 1. VERCEL ESCAPE HATCH
if (process.env.VERCEL) {
  console.log('☁️ Vercel detected! Running web build...');
  execSync('npx next build', { stdio: 'inherit' });
  process.exit(0);
}

// 2. DEFINE ROUTES TO HIDE
const routesToHide = [
  { dir: './proxy.ts', backup: './proxy.ts.bak', name: 'proxy.ts' },
  { dir: './app/auth/callback/route.ts', backup: './app/auth/callback/route.ts.bak', name: 'auth route' },
  { dir: path.join(__dirname, 'app', 'api', 'generate-bio'), backup: path.join(__dirname, 'app', 'api', '_generate-bio'), name: 'AI Bio' },
  { dir: path.join(__dirname, 'app', 'api', 'cron'), backup: path.join(__dirname, 'app', 'api', '_cron'), name: 'Cron' },
  { dir: path.join(__dirname, 'app', 'api', 'send-push'), backup: path.join(__dirname, 'app', 'api', '_send-push'), name: 'Push' },
  { dir: path.join(__dirname, 'app', 'api', 'referral'), backup: path.join(__dirname, 'app', 'api', '_referral_hidden'), name: 'Referral' },
  { dir: path.join(__dirname, 'app', 'api', 'checkout'), backup: path.join(__dirname, 'app', 'api', '_checkout_hidden'), name: 'Checkout' },
  { dir: path.join(__dirname, 'app', 'api', 'webhooks'), backup: path.join(__dirname, 'app', 'api', '_webhooks_hidden'), name: 'Webhooks' },
  { dir: path.join(__dirname, 'app', '[username]'), backup: path.join(__dirname, 'app', '_username_hidden'), name: '[username]' },
  { dir: path.join(__dirname, 'app', 'post', '[id]'), backup: path.join(__dirname, 'app', 'post', '_id_hidden'), name: 'post/[id]' },
  { dir: path.join(__dirname, 'app', 'post', '[postId]'), backup: path.join(__dirname, 'app', 'post', '_postId_hidden'), name: 'post/[postId]' }
];

// 3. SELF HEALING (In case a previous build crashed halfway)
routesToHide.forEach(r => {
  if (fs.existsSync(r.backup) && !fs.existsSync(r.dir)) {
    fs.renameSync(r.backup, r.dir);
  }
});

console.log('🗑️ Clearing Next.js cache...');
fs.rmSync('.next', { recursive: true, force: true });

let buildFailed = false;

try {
  console.log('🙈 Hiding dynamic routes...');
  routesToHide.forEach(r => {
    if (fs.existsSync(r.dir)) {
      fs.renameSync(r.dir, r.backup);
      console.log(`   ✅ Hid ${r.name}`);
    }
  });

  console.log('⚡ Running Next.js build...');
  execSync('npx next build', {
    stdio: 'inherit',
    env: { ...process.env, MOBILE_BUILD: 'true' }
  });
  console.log('✅ Next.js build completed successfully!');

} catch (error) {
  console.error('\n❌ BUILD CRASHED!');
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  console.error(error.message);
  buildFailed = true;
} finally {
  console.log('♻️ Restoring dynamic routes...');
  routesToHide.forEach(r => {
    if (fs.existsSync(r.backup)) {
      fs.renameSync(r.backup, r.dir);
      console.log(`   ✅ Restored ${r.name}`);
    }
  });

  if (buildFailed) {
    console.error('🛑 Exiting with error code 1.');
    process.exit(1);
  }
}