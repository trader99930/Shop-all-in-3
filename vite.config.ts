import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import express from 'express';

export default defineConfig(() => {
  return {
    base: '/Shop-all-in-3/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-server',
        async configureServer(server) {
          const app = express();
          app.use(express.json({ limit: '10mb' }));
          const { apiRouter } = await import('./src/server/api.ts');
          app.use('/api', apiRouter);
          server.middlewares.use(app);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
