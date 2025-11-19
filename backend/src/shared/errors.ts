import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: 'Not Found' });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = typeof err?.status === 'number' ? err.status : 500;
  const message = err?.message || 'Internal Server Error';
  const details = err?.details;
  // eslint-disable-next-line no-console
  if (status >= 500) console.error('Unhandled error:', err);
  res.status(status).json({ message, ...(details ? { details } : {}) });
}
