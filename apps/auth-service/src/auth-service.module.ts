import { JwtModule } from '@nestjs/jwt';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { CommonModule } from '@app/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TransformInterceptor } from '@app/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '@app/common/filters/http-exception.filter';
import { AuthServiceController } from './auth-service.controller';
import { createLoggingMiddleware } from '@app/common/middleware/logging.middleware';
import { AppLogger } from '@app/common/logger/logger.service';
import { AuthService } from './auth-service.service';


@Module({
  imports: [
    CommonModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthServiceController],  // ✅ must include your controller
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: AppLogger,
      useFactory: () => new AppLogger('auth-service'), // Pass service name here
    },
    AuthService,

  ],
})
export class AuthServiceModule {

  configure(consumer: MiddlewareConsumer) {
        consumer.apply(createLoggingMiddleware('auth-service')).forRoutes('*');  
  }
}