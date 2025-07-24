import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f8fe94018b634363ae21b380386f0616',
  appName: 'Employee Food Coupons',
  webDir: 'dist',
  server: {
    url: 'https://f8fe9401-8b63-4363-ae21-b380386f0616.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: {
        camera: 'This app needs camera access to scan QR codes for coupon redemption.'
      }
    }
  }
};

export default config;