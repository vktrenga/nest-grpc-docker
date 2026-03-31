import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { ProductServiceModule } from './product-service.module';
import * as fs from 'fs';

async function bootstrap() {

  // Start HTTP server
  const app = await NestFactory.create(ProductServiceModule);

  // const protoPath = join(process.cwd(), 'libs/common/proto/product/product.proto');
  const protoPath = join(__dirname, '../../libs/common/proto/product/product.proto');
  console.log('PROTO PATH:', protoPath);
  console.log('FILE EXISTS:', fs.existsSync(protoPath));
  // Attach gRPC microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'product',
      protoPath: protoPath,
      url: `0.0.0.0:${process.env.PORT || 8080}`,
    },
  });

  // Start gRPC
  await app.startAllMicroservices();

  // Start HTTP
  await app.listen(process.env.PORT || 8080, '0.0.0.0');

  console.log('Product Service Running');
  console.log(`HTTP  : http://localhost:${process.env.PORT || 8080}`);
  console.log(`gRPC  : ${protoPath}`);
}

bootstrap();