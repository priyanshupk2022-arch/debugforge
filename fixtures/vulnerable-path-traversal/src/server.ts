import express, { type Express } from 'express';
import { Server } from 'http';
import { fileViewerHandler } from './routes/file.ts';

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'vulnerable-path-traversal' });
  });

  app.all('/api/file', fileViewerHandler);
  app.all('/api/report', fileViewerHandler);

  return app;
}

export function startServer(port: number = 3004): Promise<Server> {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Vulnerable Path Traversal App running on port ${port}`);
      resolve(server);
    });
  });
}

const port = Number(process.env.PORT) || 3004;
startServer(port);
