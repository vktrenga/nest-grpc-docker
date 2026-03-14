import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product-service.service';

@Controller()
export class ProductGrpcController {

  constructor(private readonly productService: ProductService) {}

  @GrpcMethod('ProductService', 'GetProductsBySkus')
    async getProductsBySkus(data: { skus: string[] }) {

        const items = await this.productService.getProductsBySkus(data.skus);
        return { items };
    }
}