import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vimciety.app',
  appName: 'VIMciety',
  webDir: 'out',
  
  // ✅ FIX #17: Proper CORS and Network Handling for Android
  server: {
    androidScheme: 'https',
    cleartext: false,
  },

  // ✅ FIX #1: Push Notification configurations
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;