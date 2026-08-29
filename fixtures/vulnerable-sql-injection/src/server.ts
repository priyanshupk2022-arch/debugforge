import express, { type Express } from 'express';
import { Server } from 'http';
import { userSearchHandler } from './routes/users.ts';

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'vulnerable-sql-injection' });
  });

  app.all('/api/users/search', userSearchHandler);
  app.all('/api/report', userSearchHandler);

  return app;
}

export function startServer(port: number = 3005): Promise<Server> {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Vulnerable SQL Injection App running on port ${port}`);
      resolve(server);
    });
  });
}

const port = Number(process.env.PORT) || 3005;
startServer(port);
