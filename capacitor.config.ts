import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vimciety.app',
  appName: 'VIMciety',
  webDir: 'www',

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
    },
        // 👇 UPDATED: Google AdMob Initialization for Both Platforms
        AdMob: {
          androidAppId: 'ca-app-pub-3035141160822131~5703355644', 
          iosAppId: 'ca-app-pub-3035141160822131~[PASTE_YOUR_IOS_APP_ID_HERE]',
        }
      }
    };