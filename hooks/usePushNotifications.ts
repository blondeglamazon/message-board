import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const usePushNotifications = (userId: string | null, supabase: any) => {
  
  useEffect(() => {
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

      // 1️⃣ ALWAYS ATTACH THE LISTENER FIRST!
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success! Token: ' + token.value);
        
        // 💾 SAVE TO SUPABASE
        const { error } = await supabase.from('push_tokens').upsert({
          user_id: userId,
          token: token.value,
          platform: Capacitor.getPlatform(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'token' }); 
        
        // 2️⃣ LOG DATABASE ERRORS IF SUPABASE REJECTS IT
        if (error) {
          console.error('Supabase failed to save token:', error.message);
        } else {
          console.log('Token perfectly saved to database!');
        }
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

      // 3️⃣ NOW TELL THE OS TO GET THE TOKEN
      await PushNotifications.register();
    };

    setupPushNotifications();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [userId, supabase]);
};