import { Controller, Get, Post, UseGuards,Request } from '@nestjs/common';
import { OrderServiceService } from './order-service.service';
import { Roles } from '@app/common/decorators/roles.decorator';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { AuthGuard } from '@app/common/guards/auth.guard';
@Controller('orders')
export class OrderServiceController {
  constructor(private readonly orderServiceService: OrderServiceService) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('customer')
  async createOrder(@Request() req: any) {
    const userId = req?.user?.sub;
    if(!userId) {
      throw new Error('User ID not found in request');
    }
    return await this.orderServiceService.createOrder(userId);
  }

  @Post(':orderId/add-item')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('customer')
  async addItem(@Request() req: any) {
    const orderId = req.params.orderId;
    const itemData = req.body;
    if (!orderId || !itemData) {
      throw new Error('Order ID or item data missing');
    }
    return await this.orderServiceService.addItem(orderId, itemData);
  }

  @Post(':orderId/complete')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('customer')
  async completeOrder(@Request() req: any) {
    const orderId = req.params.orderId;
    return await this.orderServiceService.completeOrder(orderId);
  }
  
  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('customer')
  async getMyOrders(@Request() req: any) {
    const userId = req?.user?.sub;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return await this.orderServiceService.getCustomerOrders(userId, req.query,'customer');
  }

  @Get(':orderId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('customer', 'employee', 'admin')
  async getOrderDetail(@Request() req: any) {
    const orderId = req.params.orderId;
    if (!orderId) {
      throw new Error('Order ID missing');
    }
    return await this.orderServiceService.getOrderDetail(orderId);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('employee', 'admin')
  async getCustomerOrders(@Request() req: any) {
    return await this.orderServiceService.getCustomerOrders(null, req.query,'admin');
  }

  
 
}
