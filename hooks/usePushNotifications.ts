import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const usePushNotifications = (userId: string | null, supabase: any) => {
  // 1. Use React state to track the EULA so the hook can react immediately
  const [hasAgreedToEula, setHasAgreedToEula] = useState<boolean>(false);

  // 2. Listen for EULA acceptance on mount and set state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const eulaStatus = localStorage.getItem('vimciety_eula_accepted');
      if (eulaStatus === 'true') {
        setHasAgreedToEula(true);
      }
      
      // Optional: If your EULA modal sets localStorage, it can also dispatch a window event 
      // like window.dispatchEvent(new Event('eula_accepted')) so this hook catches it instantly.
      const handleEulaAccepted = () => setHasAgreedToEula(true);
      window.addEventListener('eula_accepted', handleEulaAccepted);
      return () => window.removeEventListener('eula_accepted', handleEulaAccepted);
    }
  }, []);

  useEffect(() => {
    // Wait until they have agreed, are on a native device, and are logged in
    if (!hasAgreedToEula || !Capacitor.isNativePlatform() || !userId || !supabase) return;
    
    const setupPushNotifications = async () => {
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('User denied push notifications');
        return;
      }

      // 3. We no longer need the complicated listeners array!
      await PushNotifications.addListener('registration', async (token) => {
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

      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ', error);
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', notification);
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ', notification);
        window.location.href = '/notifications';
      });

      await PushNotifications.register();
    };

    setupPushNotifications();

    // 4. Capacitor's native "nuke" command prevents all async race conditions
    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [userId, supabase, hasAgreedToEula]); // 👈 Now it properly reacts to the EULA status!
};