package com.vimciety.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.content.Intent;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ✅ FIX 5: Creates the default notification channel for Android O and above
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "default",
                "Default Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("VIMciety notifications");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        
        // This intercepts the Google popup and sends the data to the Capgo plugin
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin login handle is null");
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
                return;
            }
            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    // The plugin looks specifically for this method to verify you modified the activity
    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}