import { Module, MiddlewareConsumer } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ProductServiceController } from './product-service.controller';
import { ProductService } from './product-service.service';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from '@app/common/filters/http-exception.filter';
import { AppLogger } from '@app/common/logger/logger.service';
import { createLoggingMiddleware } from '@app/common/middleware/logging.middleware';
import { ProductSchema } from './schema/product.schema';
import { CommonModule } from '@app/common/common.module';
import { ProductGrpcController } from './product.grpc.controller';
import { TransformInterceptor } from '@app/common/interceptors/transform.interceptor';
import { ThrottlerGuard } from '@nestjs/throttler/dist/throttler.guard';
import { ThrottlerModule } from '@nestjs/throttler/dist/throttler.module';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { ConfigService } from '@nestjs/config/dist/config.service';

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
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 20, // max 20 requests
      },
    ]),
  ],
  controllers: [ProductServiceController, ProductGrpcController],
  providers: [
    ProductService,
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
      useFactory: () => new AppLogger('product-service'),
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ProductServiceModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(createLoggingMiddleware('product-service')).forRoutes('*');
  }
}
