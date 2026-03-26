import { useEffect } from 'react';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const usePushNotifications = (userId: string | null, supabase: any) => {

  useEffect(() => {
    // 1. Array to hold our specific listeners so we don't wipe out others
    let listeners: PluginListenerHandle[] = [];

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

      // 2. Save the listener references as we create them
      const regListener = await PushNotifications.addListener('registration', async (token) => {
        console.log('Raw token from Capacitor:', token.value);

        let fcmToken = token.value;

        // 🍎 Swap APNs for FCM on iOS
        if (Capacitor.getPlatform() === 'ios') {
          try {
            const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
            const result = await FirebaseMessaging.getToken();
            fcmToken = result.token;
            console.log('FCM token from Firebase:', fcmToken);
          } catch (err) {
            console.error('Failed to get FCM token on iOS:', err);
            return;
          }
        }

        // Save token to Supabase
        const { error } = await supabase.from('push_tokens').upsert({
          user_id: userId,
          token: fcmToken,
          platform: Capacitor.getPlatform(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'token' });

        if (error) {
          console.error('Supabase failed to save token:', error.message);
        } else {
          console.log('FCM token saved to database!');
        }
      });
      listeners.push(regListener);

      const errorListener = await PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ', error);
      });
      listeners.push(errorListener);

      const receivedListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', notification);
      });
      listeners.push(receivedListener);

      const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ', notification);
        window.location.href = '/notifications';
      });
      listeners.push(actionListener);

      // Finally, trigger the registration
      await PushNotifications.register();
    };

    setupPushNotifications();

    // 3. Clean up ONLY these specific listeners when the hook unmounts
    return () => {
      listeners.forEach(listener => listener.remove());
    };
  }, [userId, supabase]);
};