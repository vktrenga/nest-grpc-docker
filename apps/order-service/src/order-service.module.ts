import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { OrderServiceController } from './order-service.controller';
import { OrderServiceService } from './order-service.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { CommonModule } from '@app/common/common.module';
import { AppLogger } from '@app/common/logger/logger.service';
import { HttpExceptionFilter } from '@app/common/filters/http-exception.filter';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { createLoggingMiddleware } from '@app/common/middleware/logging.middleware';
import { TransformInterceptor } from '@app/common/interceptors/transform.interceptor';
import Redis from 'ioredis/built/Redis';
import { ThrottlerModule } from '@nestjs/throttler/dist/throttler.module';
import { ThrottlerGuard } from '@nestjs/throttler/dist/throttler.guard';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { ConfigModule } from '@nestjs/config/dist/config.module';

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
    ClientsModule.registerAsync([
      {
        name: 'PRODUCT_PACKAGE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: configService.get<string>('PRODUCT_GRPC_URL'),
            package: 'product',
            protoPath: join(
              process.cwd(),
              'libs/common/proto/product/product.proto',
            ),
          },
        }),
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [Order, OrderItem],
        synchronize: true,
        ssl: {
          rejectUnauthorized: false,
        },
        logging: true, // 👈 add this
      }),
    }),
    TypeOrmModule.forFeature([Order, OrderItem]),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 20, // max 20 requests
      },
    ]),
  ],
  controllers: [OrderServiceController],
  providers: [
    OrderServiceService,
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
      useFactory: () => new AppLogger('order-service'),
    },
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Redis(configService.get<string>('REDIS_HOST') || 'redis://localhost:6379');
      },
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class OrderServiceModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(createLoggingMiddleware('order-service')).forRoutes('*');
  }
}
