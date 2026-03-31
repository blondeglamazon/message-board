import { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const usePushNotifications = (userId: string | null, supabase: any) => {
  const [hasAgreedToEula, setHasAgreedToEula] = useState<boolean>(false);
  const currentToken = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const eulaStatus = localStorage.getItem('vimciety_eula_accepted');
      if (eulaStatus === 'true') {
        setHasAgreedToEula(true);
      }

      const handleEulaAccepted = () => setHasAgreedToEula(true);
      window.addEventListener('eula_accepted', handleEulaAccepted);
      return () => window.removeEventListener('eula_accepted', handleEulaAccepted);
    }
  }, []);

  // Re-register token whenever userId changes
  useEffect(() => {
    if (!userId || !supabase || !currentToken.current) return;

    const updateToken = async () => {
      const { error } = await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          token: currentToken.current,
          platform: Capacitor.getPlatform(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );
      if (error) {
        console.error('Failed to update token for new user:', error.message);
      } else {
        console.log('Token reassigned to user:', userId);
      }
    };

    updateToken();
  }, [userId, supabase]);

  useEffect(() => {
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

      await PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success! Token: ' + token.value);
        currentToken.current = token.value;

        const { error } = await supabase.from('push_tokens').upsert(
          {
            user_id: userId,
            token: token.value,
            platform: Capacitor.getPlatform(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'token' }
        );

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

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [userId, supabase, hasAgreedToEula]);
};