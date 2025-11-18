import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './env.ts';
import authRoutes from './routes/auth.ts';
import bookRoutes from './routes/books.ts';
import villageRoutes from './routes/villages.ts';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/villages', villageRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'Errore interno' });
});

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API pronta su http://localhost:${env.port}`);
});
