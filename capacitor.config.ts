import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mingisa.crew',
  appName: 'mingisa-crew',
  webDir: 'out',
  server: {
    url: 'https://crew.mingisa.com',
    cleartext: false,
  },
};

export default config;
