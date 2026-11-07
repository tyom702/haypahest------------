import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const API_TARGET = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        proxy: {
          '/api': {
            target: API_TARGET,
            changeOrigin: true,
          },
        },
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));

    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[HayPahest] Frontend running at http://${HOST}:${PORT}`);
    if (!isProd) {
      console.log(`[HayPahest] Development /api proxy target: ${API_TARGET}`);
    }
  });
}

startServer().catch((error: unknown) => {
  console.error('[HayPahest] Failed to start frontend:', error);
  process.exitCode = 1;
});
