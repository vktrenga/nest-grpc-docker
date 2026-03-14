import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLogger {
  private logger: Logger;

  constructor(private readonly serviceName: string) {
    this.logger = new Logger(serviceName); // serviceName replaces default [HTTP]
  }

  log(message: string) {
    this.logger.log(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, trace);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}