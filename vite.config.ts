import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      __AIPANEL_FEISHU_BITABLE_SOURCE_URL__: JSON.stringify(env.FEISHU_BITABLE_SOURCE_URL ?? '')
    },
    server: {
      port: 5173
    },
    build: {
      // Split vendor code from app code so React stays cached across deploys
      // and the initial JS payload for cached users is small.
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom']
          }
        }
      },
      // Keep CSS inline-friendly so the first paint isn't blocked by an extra fetch.
      cssCodeSplit: true,
      // Slightly smaller modulepreload list; Vite preloads all imports by default,
      // which can hurt cold start when we want to defer non-critical chunks.
      modulePreload: {
        polyfill: false
      }
    }
  };
});
