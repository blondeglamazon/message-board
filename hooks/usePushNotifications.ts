import { useEffect, useState, useRef } from 'react';
import { Capacitor, PluginListenerHandle } from '@capacitor/core'; // 👈 Moved PluginListenerHandle here!
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

    // We store the handles here so we can clean them up safely without nuking the layout listener
    let regListener: PluginListenerHandle;
    let regErrorListener: PluginListenerHandle;
    let receivedListener: PluginListenerHandle;

    const setupPushNotifications = async () => {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('User denied push notifications');
        return;
      }

      regListener = await PushNotifications.addListener('registration', async (token) => {
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

      regErrorListener = await PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ', error);
      });

      receivedListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ', notification);
      });

      await PushNotifications.register();
    };

    setupPushNotifications();

    return () => {
      // Safely remove only THESE specific listeners
      if (regListener) regListener.remove();
      if (regErrorListener) regErrorListener.remove();
      if (receivedListener) receivedListener.remove();
    };
  }, [userId, supabase, hasAgreedToEula]);
};