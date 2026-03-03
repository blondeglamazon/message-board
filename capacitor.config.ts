import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vimciety.app',
  appName: 'VIMciety',
  webDir: 'out',
  
  // ✅ FIX #17: Proper CORS and Network Handling for Android
  server: {
    androidScheme: 'https',
    cleartext: true
  },

  // (Optional) Space for your future AdMob/Push Notification configurations
  plugins: {
    // AdMob config can go here if you decide to use advanced Capacitor-AdMob features later
  }
};

export default config;