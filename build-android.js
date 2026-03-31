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
  { dir: path.join(__dirname, 'app', 'u', '[username]'), backup: path.join(__dirname, 'app', 'u', '_username_hidden'), name: 'u/[username]' },
  { dir: path.join(__dirname, 'app', 'post', '[id]'), backup: path.join(__dirname, 'app', 'post', '_id_hidden'), name: 'post/[id]' },
  { dir: path.join(__dirname, 'app', 'post', '[postId]'), backup: path.join(__dirname, 'app', 'post', '_postId_hidden'), name: 'post/[postId]' },
  { dir: path.join(__dirname, 'app', 'admin'), backup: path.join(__dirname, 'app', '_admin_hidden'), name: 'Admin Dashboard' },
  // 👇 NEW: Hiding Sitemaps to prevent Supabase data-fetching crashes on mobile!
  { dir: path.join(__dirname, 'app', 'sitemap.ts'), backup: path.join(__dirname, 'app', '_sitemap.ts.bak'), name: 'Sitemap (TS)' },
  { dir: path.join(__dirname, 'app', 'sitemap.xml'), backup: path.join(__dirname, 'app', '_sitemap.xml.bak'), name: 'Sitemap (XML)' },
  // 👇 Hide Stripe routes for mobile
  { dir: path.join(__dirname, 'app', 'api', 'stripe'), backup: path.join(__dirname, 'app', 'api', '_stripe_hidden'), name: 'Stripe' },
  { dir: path.join(__dirname, 'app', 'api', 'products'), backup: path.join(__dirname, 'app', 'api', '_products_hidden'), name: 'Products' }
];

// Helper: Pause execution for X milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Windows-proof rename function with automatic retries and NO crashes
async function safeRename(oldPath, newPath) {
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }
      return true; // Success! 
    } catch (err) {
      if (i === maxRetries - 1) {
        console.error(`\n⚠️ WARNING: Windows completely locked ${path.basename(oldPath)}.`);
        console.error(`👉 YOU MUST MANUALLY RENAME IT LATER: ${path.basename(oldPath)} -> ${path.basename(newPath)}`);
        return false; // Failed, but gracefully exit instead of crashing!
      }
      
      // If Windows file watcher locked it, wait 1000ms (1 full second) and try again
      if (err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES') {
        console.log(`   ⏳ Windows locked ${path.basename(oldPath)}, retrying in 1s... (Attempt ${i + 1}/${maxRetries})`);
        await sleep(1000); 
      } else {
        console.error(`\n⚠️ Unexpected error renaming ${path.basename(oldPath)}: ${err.message}`);
        return false; 
      }
    }
  }
  return false;
}

// 3. MAIN ASYNC EXECUTION
async function runBuild() {
  // SELF HEALING (In case a previous build crashed halfway)
  for (const r of routesToHide) {
    if (fs.existsSync(r.backup) && !fs.existsSync(r.dir)) {
      await safeRename(r.backup, r.dir);
    }
  }

  console.log('🗑️ Clearing Next.js cache...');
  fs.rmSync('.next', { recursive: true, force: true });

  let buildFailed = false;

  try {
    console.log('🙈 Hiding dynamic routes...');
    for (const r of routesToHide) {
      if (fs.existsSync(r.dir)) {
        const success = await safeRename(r.dir, r.backup);
        if (success) console.log(`   ✅ Hid ${r.name}`);
      }
    }

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
    for (const r of routesToHide) {
      if (fs.existsSync(r.backup)) {
        const success = await safeRename(r.backup, r.dir);
        if (success) {
          console.log(`   ✅ Restored ${r.name}`);
        } else {
          console.log(`   ❌ Skipped ${r.name} (Requires manual rename)`);
        }
      }
    }

    if (buildFailed) {
      console.error('🛑 Exiting with error code 1.');
      process.exit(1);
    }
  }
}

// Start the sequence
runBuild();