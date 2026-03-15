import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

// 🚀 ACCEPT SUPABASE AS A PARAMETER
export const usePushNotifications = (userId: string | null, supabase: any) => {
  
  useEffect(() => {
    // Only run this on native iOS/Android, and only if we have a user and database client
    if (!Capacitor.isNativePlatform() || !userId || !supabase) return;

    const setupPushNotifications = async () => {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('User denied push notifications');
        return;
      }

      await PushNotifications.register();

      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success! Token: ' + token.value);
        
        // 💾 SAVE TO SUPABASE (Using the client passed from PushManager)
        await supabase.from('push_tokens').upsert({
          user_id: userId,
          token: token.value,
          platform: Capacitor.getPlatform(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'token' }); 
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ', notification);
        window.location.href = '/notifications';
      });
    };

    setupPushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [userId, supabase]);
};