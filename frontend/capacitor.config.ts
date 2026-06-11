import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pulsehealthcare.app',
  appName: 'Pulse',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen'
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '367526945989-ebnif0f9q0s080kab2clgd42d10qqhok.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
