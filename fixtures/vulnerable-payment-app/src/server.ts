import express, { type Express } from 'express';
import { Server } from 'http';
import { handlePaymentReport } from './routes/report.ts';

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'vulnerable-payment-app' });
  });

  app.all('/api/report', handlePaymentReport);

  return app;
}

export function startServer(port: number = 3000): Promise<Server> {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Vulnerable Payment App running on port ${port}`);
      resolve(server);
    });
  });
}

const port = Number(process.env.PORT) || 3000;
startServer(port);
