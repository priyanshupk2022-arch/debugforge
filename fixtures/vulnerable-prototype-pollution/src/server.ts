import express, { type Express } from 'express';
import { Server } from 'http';
import { handleConfigUpdate, getConfigState } from './routes/config.ts';

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'vulnerable-prototype-pollution' });
  });

  app.get('/api/config', (_req, res) => {
    res.status(200).json(getConfigState());
  });

  app.all('/api/config', handleConfigUpdate);
  app.all('/api/config/update', handleConfigUpdate);
  app.all('/api/report', handleConfigUpdate);

  return app;
}

export function startServer(port: number = 3001): Promise<Server> {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Vulnerable Prototype Pollution Microservice running on port ${port}`);
      resolve(server);
    });
  });
}

const port = Number(process.env.PORT) || 3001;
startServer(port);
