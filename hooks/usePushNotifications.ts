import { useEffect, useState } from 'react';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const usePushNotifications = (userId: string | null, supabase: any) => {
  const [hasAgreedToEula, setHasAgreedToEula] = useState<boolean>(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // ---- EULA gate (unchanged) ----
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eulaStatus = localStorage.getItem('vimciety_eula_accepted');
    if (eulaStatus === 'true') setHasAgreedToEula(true);

    const handleEulaAccepted = () => setHasAgreedToEula(true);
    window.addEventListener('eula_accepted', handleEulaAccepted);
    return () => window.removeEventListener('eula_accepted', handleEulaAccepted);
  }, []);

  // ---- One-time Capacitor push setup (register + listeners) ----
  // This effect only depends on the EULA + native platform. It does NOT depend
  // on userId, so we don't tear down and re-register listeners on every account
  // switch. The `registration` listener just captures the token into state.
  useEffect(() => {
    if (!hasAgreedToEula || !Capacitor.isNativePlatform()) return;

    let regListener: PluginListenerHandle | undefined;
    let regErrorListener: PluginListenerHandle | undefined;
    let receivedListener: PluginListenerHandle | undefined;
    let cancelled = false;

    const setup = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') {
          console.log('[push] permission not granted:', permStatus.receive);
          return;
        }

        regListener = await PushNotifications.addListener('registration', (token) => {
          if (cancelled) return;
          console.log('[push] registration success, token prefix:', token.value.slice(0, 12));
          setCurrentToken(token.value);
        });

        regErrorListener = await PushNotifications.addListener('registrationError', (err) => {
          console.error('[push] registration error:', err);
        });

        receivedListener = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('[push] received:', notification);
          }
        );

        await PushNotifications.register();
      } catch (e) {
        console.error('[push] setup failed:', e);
      }
    };

    setup();

    return () => {
      cancelled = true;
      regListener?.remove();
      regErrorListener?.remove();
      receivedListener?.remove();
    };
  }, [hasAgreedToEula]);

  // ---- Write the token to the DB any time userId OR token changes ----
  // Delete-then-insert pattern: first release the token from whatever user
  // previously owned it on this device, then insert it under the current user.
  // The "Anyone can release a token" RLS policy allows the delete.
  useEffect(() => {
    if (!userId || !supabase || !currentToken) return;

    let cancelled = false;

    const writeToken = async () => {
      const token = currentToken;
      const platform = Capacitor.getPlatform();

      // 1. Release the token from any previous owner (or no-op if unowned)
      const { error: delError } = await supabase
        .from('push_tokens')
        .delete()
        .eq('token', token);
      if (delError) {
        console.error('[push] release-old-token failed:', delError.message);
        // Don't return — still try the insert in case the row didn't exist
      }

      if (cancelled) return;

      // 2. Insert fresh row for current user
      const { error: insError } = await supabase.from('push_tokens').insert({
        user_id: userId,
        token,
        platform,
        updated_at: new Date().toISOString(),
      });

      if (insError) {
        console.error('[push] insert token failed:', insError.message);
      } else {
        console.log('[push] token registered for user', userId);
      }
    };

    writeToken();

    return () => {
      cancelled = true;
    };
  }, [userId, supabase, currentToken]);
};