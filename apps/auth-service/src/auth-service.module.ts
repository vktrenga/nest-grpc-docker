import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from '@app/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TransformInterceptor } from '@app/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '@app/common/filters/http-exception.filter';
import { AuthServiceController } from './auth-service.controller';
import { createLoggingMiddleware } from '@app/common/middleware/logging.middleware';
import { AppLogger } from '@app/common/logger/logger.service';
import { AuthService } from './auth-service.service';
import { APP_GUARD } from '@nestjs/core';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,   // 60 seconds
        limit: 3,    // max 2 requests
      },
    ]),
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
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AuthService,

  ],
})
export class AuthServiceModule {

  configure(consumer: MiddlewareConsumer) {
        consumer.apply(createLoggingMiddleware('auth-service')).forRoutes('*');  
  }
}