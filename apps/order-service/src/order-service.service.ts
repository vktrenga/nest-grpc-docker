import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import Redis from 'ioredis';
import { GetOrdersDto } from './order.interface';
import { AppLogger } from '@app/common/logger/logger.service';

interface ProductService {
  GetProductsBySkus(data: { skus: string[] }): any;
}

@Injectable()
export class OrderServiceService implements OnModuleInit {
  private productService: ProductService;

  constructor(
    @Inject('PRODUCT_PACKAGE') private client: ClientGrpc,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
    private readonly logger: AppLogger,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  onModuleInit() {
    this.productService =
      this.client.getService<ProductService>('ProductService');
  }

  async getProductFromCache(sku: string) {
    const cached = await this.redisClient.get(`product:${sku}`);
    return cached ? JSON.parse(cached) : null;
  }

  async setProductCache(sku: string, product: any) {
    this.logger.log(`Setting cache for SKU: ${sku} - ${JSON.stringify(product)}`);
    await this.redisClient.setex(
      `product:${sku}`,
      600,
      JSON.stringify(product),
    );
  }

  async getProductsByGrpc(skus: string[], isCheckCache = true) {
    try {
      let missingSkus: string[] = [];
      const cachedProducts: any = {};
      if (isCheckCache === true) {
        for (const sku of skus) {
          const cachedValue = await this.getProductFromCache(sku);
          if (cachedValue) {
            this.logger.log(`Cache hit for SKU: ${sku}`+JSON.stringify(cachedValue));
            cachedProducts[sku] = cachedValue;
          } else {
            this.logger.log(`Cache miss for SKU: ${sku}`);
            missingSkus.push(sku);
          }
        }
      } else {
        missingSkus = skus;
      }
      let response: any = {items: []};
      if(missingSkus.length > 0) {
       response = await firstValueFrom(
        this.productService.GetProductsBySkus({ skus: missingSkus }),
      );
      if (response) {
        for (const product of response?.items) {
          await this.setProductCache(product.sku, product);
        }
      }
    }
     if (Object.keys(cachedProducts).length > 0) {
        response?.items.push(...Object.values(cachedProducts));
      } 
      return response;
    } catch (error) {
      this.logger.error(
        'Error fetching product details from gRPC service',
        error,
      );
      throw new Error('Failed to fetch product details');
    }
  }

  async createOrder(userId: string) {
    const order = this.orderRepo.create({
      userId,
      status: 'PENDING',
      totalAmount: 0,
    });
    return this.orderRepo.save(order);
  }

  async addItem(orderId: string, itemData: any) {
    //  Fetch order with items
    const order: any = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) throw new Error('Order not found');

    //  Fetch product details
    const products: any = await this.getProductsByGrpc([itemData.sku], true);
    if (!products.items.length) {
      throw new Error(`Product with SKU ${itemData.sku} not found`);
    }

    const product = products.items.find((p) => p.sku === itemData.sku);
    if (!product) {
      throw new Error(`Product with SKU ${itemData.sku} not found in items`);
    }
    if (product.stock < itemData.quantity) {
      throw new Error(`Insufficient stock for SKU ${itemData.sku}`);
    }

    //  Calculate prices
    const unitPrice = product.price;
    const totalPrice = unitPrice * itemData.quantity;

    //  Check if item already exists in order
    let existingItem = order.items.find((i: any) => i.sku === itemData.sku);

    if (existingItem) {
      //  Update existing item
      existingItem.quantity = Number(itemData.quantity);
      existingItem.unitPrice = unitPrice;
      existingItem.totalPrice = totalPrice;

      await this.orderItemRepo.save(existingItem);
    } else {
      //Create new item
      const newItem = this.orderItemRepo.create({
        ...itemData,
        unitPrice,
        totalPrice,
        order,
      });
      await this.orderItemRepo.save(newItem);

      // Add new item to order.items in memory
      order.items.push(newItem);
    }

    // Update order total
    order.totalAmount = order.items.reduce(
      (sum: number, i: any) => sum + i.totalPrice,
      0,
    );
    await this.orderRepo.save(order);

    //  Map product details for response
    const productDetails = await this.mapProducts([itemData], true);
    return {
      items: productDetails[0],
      message: 'Item added to order successfully',
    };
  }

  async completeOrder(orderId: string) {
    const order: any = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) throw new Error('Order not found');
    const itemsSkus = order.items.map((i: any) => i.sku);
    const products: any = await this.getProductsByGrpc(itemsSkus, false);
    for (const item of order.items) {
      const product = products.items.find((p) => p.sku === item.sku);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for SKU ${item.sku}`);
      }
      //  check the price has not changed
      if (Number(product.price) !== Number(item.unitPrice)) {
        // update current price in order item
        item.unitPrice = product.price;
        item.totalPrice = item.quantity * product.price;
        await this.orderItemRepo.save(item);
        return {
          message: `Price for SKU ${item.sku} has changed. Order updated with new price. Please review and complete the order again.`,
        };
      }
      order.status = 'COMPLETED';
      await this.orderRepo.save(order);
      return { message: 'Order completed successfully' };
    }
  }

  async getCustomerOrders(
    userId: string | null,
    query: GetOrdersDto,
    mode = 'customer',
  ) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    // Build dynamic filters
    let filters: any = {};
    if (mode === 'customer') {
      filters = { userId:  userId };
    }
     if (mode !== 'customer' && query?.userId) {
      filters = { userId: query?.userId };
    }
     if (query.status) {
      filters.status = query.status;
    }
    if (query.status) {
      filters.status = query.status;
    }

    if (query.startDate || query.endDate) {
      filters.createdAt = {};
      if (query.startDate) filters.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filters.createdAt.$lte = new Date(query.endDate);
    }

    // Fetch total count for pagination
    const total = await this.orderRepo.count({ where: filters });

    // Fetch paginated orders
    const orders = await this.orderRepo.find({
      where: filters,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      orders,
    };
  }

  async getOrderDetail(orderId: string) {
    const order: any = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new Error('Order not found');
    }
    order.items =
      order.items.length > 0 ? await this.mapProducts(order.items, true) : [];
    return order;
  }

  async mapProducts(cartItems: any[], isCache = true) {
    const itemsSkus = cartItems.map((i: any) => i.sku);

    const products: any = await this.getProductsByGrpc(itemsSkus, isCache);

    return cartItems.map((item) => {
      const product = products?.items.find(
        (productItem: any) => productItem.sku === item.sku,
      );
      return {
        name: product?.name,
        category: product?.category,
        brand: product?.brand,
        sku: product?.sku,
        price: item?.price,
        quantity: item?.quantity,
        totalPrice: item?.totalPrice,
        itemUnitPrice: item?.unitPrice,
      };
    });
  }
}
