import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Tripflow",
        short_name: "Tripflow",
        description: "Controla tu presupuesto de viaje",
        // theme_color / background_color / icons: se completan en la fase de branding
        start_url: "/",
        display: "standalone",
      },
    }),
  ],
});
