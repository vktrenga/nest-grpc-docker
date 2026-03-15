
import { Controller, Get, Post, Body, UseGuards, Request, UsePipes, ValidationPipe, Param, Delete } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { Roles } from '@app/common/decorators/roles.decorator';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { AuthGuard } from '@app/common/guards/auth.guard';
import { ProductService } from './product-service.service';
import { Patch } from '@nestjs/common';
import { UpdateProductDto } from './dto/update-product.dto';
import { AppLogger } from '@app/common/logger/logger.service';

@Controller('products')
@UsePipes(new ValidationPipe({
  transform: true,
  exceptionFactory: (errors) => {
    return {
      statusCode: 400,
      message: 'Validation failed',
      errors: errors.map(err => ({
        property: err.property,
        constraints: err.constraints,
      })),
    };
  },
}))
export class ProductServiceController {
  constructor(private readonly productService: ProductService, private readonly logger: AppLogger) {}

 

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'employee', 'customer')
  @UseInterceptors(ClassSerializerInterceptor)
  getProducts(@Request() req: any) {
    const currnetPage = req.query.page || 1;
    const pageSize = req.query.limit || 10; 
    const filters: any = { deleted: false };

    if (req.query.q) {
      filters.name = { $regex: req.query.q, $options: 'i' }; // case-insensitive search
    }

    if (req.query.category) {
      filters.category = req.query.category;
    }

    if (req.query.brand) {
      filters.brand = req.query.brand;
    }
    return this.productService.findAll({ page: currnetPage, limit: pageSize, ...filters });
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @UseInterceptors(ClassSerializerInterceptor)
  createProduct(@Body() productData: CreateProductDto, @Request() req: any) {
    return this.productService.create(productData);
  }
  
  @Patch(':productId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  @UseInterceptors(ClassSerializerInterceptor)
  async update(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
    @Request() req: any
  ) {
    return this.productService.update(productId,  dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'employee', 'customer')
  @UseInterceptors(ClassSerializerInterceptor)
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.productService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'employee')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.productService.delete(id);
  }
  @Post('seed')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async seedProducts(): Promise<any[]> {
    return this.productService.insertProductsFromJSON();
  }
}
