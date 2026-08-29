import express, { type Express } from 'express';
import { Server } from 'http';
import { webhookHandler } from './routes/webhook.ts';

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'vulnerable-ssrf-app' });
  });

  app.all('/api/webhook', webhookHandler);
  app.all('/api/report', webhookHandler);

  return app;
}

export function startServer(port: number = 3003): Promise<Server> {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Vulnerable SSRF App running on port ${port}`);
      resolve(server);
    });
  });
}

const port = Number(process.env.PORT) || 3003;
startServer(port);
