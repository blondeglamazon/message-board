const { execSync } = require('child_process');

if (process.env.VERCEL) {
  console.log('☁️  Vercel detected — running standard Next.js build...');
  execSync('npx next build', { stdio: 'inherit' });
} else {
  console.log('📱 Non-Vercel environment — running mobile static export build...');
  execSync('cross-env MOBILE_BUILD=true node build-android.js', { stdio: 'inherit' });
  console.log('📁 Renaming out/ to www/ for Capacitor...');
  execSync('rm -rf www && mv out www', { stdio: 'inherit' });
}