import { Module, MiddlewareConsumer } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ProductServiceController } from './product-service.controller';
import { ProductService } from './product-service.service';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from '@app/common/filters/http-exception.filter';
import { AppLogger } from '@app/common/logger/logger.service';
import { createLoggingMiddleware } from '@app/common/middleware/logging.middleware';
import { ProductSchema } from './schema/product.schema';
import { CommonModule } from '@app/common/common.module';
import { ProductGrpcController } from './product.grpc.controller';

@Module({
  imports: [
    CommonModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, 
      signOptions: { expiresIn: '1h' },
    }),
    MongooseModule.forRoot(process.env.MONGO_URI!), 
    MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]),
  ],
  controllers: [ProductServiceController,ProductGrpcController],
  providers: [
    ProductService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: AppLogger,
      useFactory: () => new AppLogger('product-service'), 
    },
  ],
})
export class ProductServiceModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(createLoggingMiddleware('product-service')).forRoutes('*');
  }
}
