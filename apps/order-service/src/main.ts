import { NestFactory } from '@nestjs/core';
import { OrderServiceModule } from './order-service.module';

async function bootstrap() {
  const app = await NestFactory.create(OrderServiceModule);
  await app.listen(process.env.PORT || 8080, '0.0.0.0');
}
bootstrap();
