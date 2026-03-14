import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { OrderServiceController } from './order-service.controller';
import { OrderServiceService } from './order-service.service';

@Module({
  imports: [
  ClientsModule.register([
    {
      name: 'PRODUCT_PACKAGE',
      transport: Transport.GRPC,
      options: {
        url: 'product-service:50051',
        package: 'product',
        protoPath: join(process.cwd(), 'libs/common/proto/product/product.proto'),

      },
    },
  ]),
],
  controllers: [OrderServiceController],
  providers: [OrderServiceService],
})
export class OrderServiceModule {}