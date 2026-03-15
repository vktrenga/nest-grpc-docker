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

@Module({
  imports: [
    CommonModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    ClientsModule.register([
      {
        name: 'PRODUCT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          url: 'product-service:50051',
          package: 'product',
          protoPath: join(
            process.cwd(),
            'libs/common/proto/product/product.proto',
          ),
        },
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'postgres', // docker service name
      port: 5432,
      username: 'admin',
      password: 'admin',
      database: 'ecommerce',
      entities: [Order, OrderItem],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Order, OrderItem]),
    ThrottlerModule.forRoot([
          {
            ttl: 60000,   // 60 seconds
            limit: 20,    // max 20 requests
          }])
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
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
        });
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
