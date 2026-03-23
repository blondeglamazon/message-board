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

  plugins: {
    // ✅ FIX #1: Push Notification configurations
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // ✅ NEW FIX: Completely disable and remove the Facebook SDK to prevent Xcode 15 crashes
    SocialLogin: {
      providers: {
        facebook: false
      }
    }
  }
};

export default config;