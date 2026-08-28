import express from 'express';
import { webhookHandler } from './routes/webhook.js';

const app = express();
app.use(express.json());

app.post('/api/webhook', webhookHandler);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Vulnerable SSRF App listening on port ${port}`);
  });
}

export { app };
