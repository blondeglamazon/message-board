import { useEffect, useState } from 'react';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const usePushNotifications = (userId: string | null, supabase: any) => {
  const [hasAgreedToEula, setHasAgreedToEula] = useState<boolean>(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // Fire-and-forget debug writer. Uses Supabase so we can read it server-side.
  const debugLog = (event: string, details: Record<string, any> = {}) => {
    try {
      console.log(`[push] ${event}`, details);
      if (supabase) {
        supabase
          .from('push_debug_log')
          .insert({ event, user_id: userId, details })
          .then(({ error }: any) => {
            if (error) console.error('[push] debugLog insert failed:', error.message);
          });
      }
    } catch (e) {
      console.error('[push] debugLog error:', e);
    }
  };

  // ---- EULA gate ----
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const eulaStatus = localStorage.getItem('vimciety_eula_accepted');
    debugLog('eula_check', { eulaStatus });
    if (eulaStatus === 'true') setHasAgreedToEula(true);

    const handleEulaAccepted = () => {
      debugLog('eula_accepted_event');
      setHasAgreedToEula(true);
    };
    window.addEventListener('eula_accepted', handleEulaAccepted);
    return () => window.removeEventListener('eula_accepted', handleEulaAccepted);
  }, []);

  // ---- Capacitor setup (once per EULA gate) ----
  useEffect(() => {
    debugLog('setup_effect_fired', {
      hasAgreedToEula,
      isNative: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
    });

    if (!hasAgreedToEula || !Capacitor.isNativePlatform()) {
      debugLog('setup_effect_bailed', {
        reason: !hasAgreedToEula ? 'no_eula' : 'not_native',
      });
      return;
    }

    let regListener: PluginListenerHandle | undefined;
    let regErrorListener: PluginListenerHandle | undefined;
    let receivedListener: PluginListenerHandle | undefined;
    let cancelled = false;

    const setup = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        debugLog('perm_check', { receive: permStatus.receive });

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
          debugLog('perm_requested', { receive: permStatus.receive });
        }

        if (permStatus.receive !== 'granted') {
          debugLog('perm_denied', { receive: permStatus.receive });
          return;
        }

        regListener = await PushNotifications.addListener('registration', (token) => {
          if (cancelled) return;
          debugLog('registration_event', { tokenPrefix: token.value.slice(0, 12) });
          setCurrentToken(token.value);
        });

        regErrorListener = await PushNotifications.addListener('registrationError', (err) => {
          debugLog('registration_error', { error: String(err?.error || err) });
        });

        receivedListener = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            debugLog('push_received', { title: notification.title });
          }
        );

        debugLog('calling_register');
        await PushNotifications.register();
        debugLog('register_resolved');
      } catch (e: any) {
        debugLog('setup_exception', { message: e?.message, stack: e?.stack });
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

 // ---- DB writer effect: call the register_push_token RPC ----
  useEffect(() => {
    debugLog('writer_effect_fired', {
      hasUserId: !!userId,
      hasSupabase: !!supabase,
      hasToken: !!currentToken,
      tokenPrefix: currentToken?.slice(0, 12),
      userId,
    });

    if (!userId || !supabase || !currentToken) {
      debugLog('writer_effect_bailed', {
        missing: !userId ? 'userId' : !supabase ? 'supabase' : 'token',
      });
      return;
    }

    let cancelled = false;

    const writeToken = async () => {
      const token = currentToken;
      const platform = Capacitor.getPlatform();

      const { error } = await supabase.rpc('register_push_token', {
        p_token: token,
        p_platform: platform,
      });

      if (cancelled) return;

      if (error) {
        debugLog('rpc_failed', { message: error.message });
      } else {
        debugLog('rpc_ok', { userId, platform });
      }
    };

    writeToken();

      return () => {
        cancelled = true;
      };
    }, [userId, supabase, currentToken]);
  };