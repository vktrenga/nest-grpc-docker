import { Controller, Get } from '@nestjs/common';
import { OrderServiceService } from './order-service.service';

@Controller()
export class OrderServiceController {
  constructor(private readonly orderServiceService: OrderServiceService) {}

  @Get()
  async getHello() {
    return await this.orderServiceService.getProducts();
  }
}
