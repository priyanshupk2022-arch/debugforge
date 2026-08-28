import express from 'express';
import { fileViewerHandler } from './routes/file.js';

const app = express();
app.use(express.json());

app.post('/api/file', fileViewerHandler);
app.get('/api/file', fileViewerHandler);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Vulnerable Path Traversal App listening on port ${port}`);
  });
}

export { app };
