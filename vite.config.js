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
        theme_color: "#001860",
        background_color: "#F5F5F5",
        // icons: pendiente el set de íconos PWA (192/512px) del logo definitivo
        start_url: "/",
        display: "standalone",
      },
    }),
  ],
});
