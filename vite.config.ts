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
    }
  };
});
