import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('three')) return 'vendor-three';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('gsap') || id.includes('lenis')) return 'vendor-scroll';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 8080,
    host: true,
    // Local growth-api (cd growth-api && php -S 127.0.0.1:8787), same-origin like production
    proxy: {
      '/api/ai': {
        target: 'http://127.0.0.1:8787',
        rewrite: (path) => path.replace(/^\/api\/ai/, ''),
      },
    },
  }
})
