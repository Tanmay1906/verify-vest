import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import app from './app.js';
import { startPoller } from './jobs/poller.js';

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${PORT}`);
  // Start background poller (non-blocking)
  void startPoller();
});
