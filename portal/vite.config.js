import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Served at https://chromologtechnologies.com/portal/ ; API at /api/ai/v1
export default defineConfig({
  base: "/portal/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    // Local growth-api: CHROMOLOG_CONFIG=... php -S 127.0.0.1:8788 dev-router.php
    proxy: {
      "/api/ai": { target: "http://127.0.0.1:8788", rewrite: (p) => p.replace(/^\/api\/ai/, "") },
    },
  },
});
