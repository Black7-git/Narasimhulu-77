/**
 * ApplyPilot Full-Stack Express Server Entry Point
 * Mounts API routes at /api/* and mounts Vite middlewares in development.
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/api.ts';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // Fast health check endpoint for container startup readiness probes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API endpoints immediately
  app.use('/api', apiRouter);

  if (!isProduction) {
    let viteMiddlewares: express.RequestHandler | null = null;
    const viteInitPromise = import('vite')
      .then(({ createServer: createViteServer }) =>
        createViteServer({
          server: {
            middlewareMode: true,
            hmr: process.env.DISABLE_HMR !== 'true' ? undefined : false,
            watch: process.env.DISABLE_HMR === 'true' ? null : {},
          },
          appType: 'spa',
        })
      )
      .then(vite => {
        viteMiddlewares = vite.middlewares;
      });

    app.use(async (req, res, next) => {
      try {
        if (!viteMiddlewares) {
          await viteInitPromise;
        }
        if (viteMiddlewares) {
          return viteMiddlewares(req, res, next);
        }
        next();
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ApplyPilot] Full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[ApplyPilot] Server startup error:', err);
  process.exit(1);
});
