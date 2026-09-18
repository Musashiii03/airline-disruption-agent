import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[env.logLevel as LogLevel] || LOG_LEVELS.info;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLevel;
}

function formatMessage(level: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (data) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }

  return `${prefix} ${message}`;
}

export const logger = {
  debug: (message: string, data?: unknown): void => {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, data));
    }
  },

  info: (message: string, data?: unknown): void => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, data));
    }
  },

  warn: (message: string, data?: unknown): void => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, data));
    }
  },

  error: (message: string, data?: unknown): void => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, data));
    }
  },
};

/**
 * Express middleware for request logging
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}
