import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { router as healthRouter } from './routes/health.js';
import { router as grantsRouter } from './routes/grants.js';
import { router as proposalsRouter } from './routes/proposals.js';
import { router as milestonesRouter } from './routes/milestones.js';
import { router as usersRouter } from './routes/users.js';
import { router as authRouter } from './routes/auth.js';
import type { Request, Response } from 'express';
import { errorHandler, notFoundHandler } from './shared/errors.js';
import { logger } from './shared/logger.js';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ limit: '512kb', extended: true }));
app.use(pinoHttp({ logger }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 300 });
app.use(limiter);

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/grants', grantsRouter);
app.use('/api/proposals', proposalsRouter);
app.use('/api/milestones', milestonesRouter);
app.use('/api/users', usersRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true, name: 'verity-vest-backend' });
});

// 404 and error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

