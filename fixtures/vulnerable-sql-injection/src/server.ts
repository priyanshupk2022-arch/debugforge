import express from 'express';
import { userSearchHandler } from './routes/users.js';

const app = express();
app.use(express.json());

app.post('/api/users/search', userSearchHandler);
app.get('/api/users/search', userSearchHandler);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Vulnerable SQL Injection App listening on port ${port}`);
  });
}

export { app };
