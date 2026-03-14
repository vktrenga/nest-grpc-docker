import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

@Module({})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}