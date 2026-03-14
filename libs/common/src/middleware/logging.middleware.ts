import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';

export function createLoggingMiddleware(serviceName: string) {
  const logger = new Logger(serviceName);

  return function (req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const delay = Date.now() - start;
      logger.log(`${method} ${originalUrl} ${statusCode} - ${delay}ms`);
    });

    next();
  };
}