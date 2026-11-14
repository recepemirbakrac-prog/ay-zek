import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ayzek.app",
  appName: "Ay Zek",
  webDir: "public/capacitor-shell",
  server: {
    url: "https://ay-zek.vercel.app",
    cleartext: false,
    androidScheme: "https"
  }
};

export default config;
