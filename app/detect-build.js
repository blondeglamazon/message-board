const { execSync } = require('child_process');

// ============================================================================
// 🔍 SMART BUILD DETECTOR
// ============================================================================
// This script automatically picks the right build command:
// - On Vercel: runs "next build" (server-rendered, supports API routes)
// - Everywhere else (local, Ionic Appflow, CI): runs the mobile static export
// ============================================================================

if (process.env.VERCEL) {
  console.log('☁️  Vercel detected — running standard Next.js build...');
  execSync('npx next build', { stdio: 'inherit' });
} else {
  console.log('📱 Non-Vercel environment — running mobile static export build...');
  execSync('cross-env MOBILE_BUILD=true node build-android.js', { stdio: 'inherit' });
}