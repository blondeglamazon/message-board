import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vimciety.app',
  appName: 'VIMciety',
  webDir: 'out',

  // ✅ Proper CORS and Network Handling for Android
  server: {
    androidScheme: 'https',
    cleartext: false,
  },

  plugins: {
    // ✅ Push Notification configurations
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    // ✅ Disable Facebook SDK to prevent Xcode crashes
    SocialLogin: {
      providers: {
        facebook: false
      }
    }
  }
};

export default config;