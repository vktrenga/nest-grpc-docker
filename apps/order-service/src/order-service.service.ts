import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

interface ProductService {
  GetProductsBySkus(data: { skus: string[] }): any;
}

@Injectable()
export class OrderServiceService implements OnModuleInit {

  private productService: ProductService;

  constructor(
    @Inject('PRODUCT_PACKAGE') private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productService =
      this.client.getService<ProductService>('ProductService');
  }

  async getProducts() {

    const response = await firstValueFrom(
      this.productService.GetProductsBySkus({ skus: ['iPhone-12'] }),
    );
    return response;
  }
}