import { useEffect } from 'react';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const usePushNotifications = (userId: string | null, supabase: any) => {
  useEffect(() => {
    // 🛑 Define the array to hold our listeners so we don't get a ReferenceError!
    let listeners: PluginListenerHandle[] = [];

    // 🛑 NEW: Don't ask for push permissions if they haven't agreed to the EULA yet!
    const hasAgreedToEula = typeof window !== 'undefined' ? localStorage.getItem('vimciety_eula_accepted') : null;
    if (!hasAgreedToEula) return; 

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

      const regListener = await PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success! Token: ' + token.value);
        
        const { error } = await supabase.from('push_tokens').upsert({
          user_id: userId,
          token: token.value,
          platform: Capacitor.getPlatform(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'token' });
        
        if (error) {
          console.error('Supabase failed to save token:', error.message);
        } else {
          console.log('Token saved to database!');
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

      await PushNotifications.register();
    };

    setupPushNotifications();

    return () => {
      listeners.forEach(listener => listener.remove());
    };
  }, [userId, supabase]);
};