import express, { type Express } from 'express';
import { Server } from 'http';
import { handleUserProfile } from './routes/auth.ts';

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'vulnerable-jwt-auth' });
  });

  app.get('/api/user/profile', handleUserProfile);

  return app;
}

export function startServer(port: number = 3002): Promise<Server> {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Vulnerable JWT Auth Microservice running on port ${port}`);
      resolve(server);
    });
  });
}

import { fileURLToPath } from 'url';

if (process.env.NODE_ENV !== 'test' && process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3002;
  startServer(port);
}
