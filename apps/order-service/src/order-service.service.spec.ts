import { Test, TestingModule } from '@nestjs/testing';
import { OrderServiceService } from './order-service.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { AppLogger } from '@app/common/logger/logger.service';

describe('OrderServiceService', () => {
  let service: OrderServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderServiceService,
        { provide: getRepositoryToken(Order), useValue: {} },
        { provide: getRepositoryToken(OrderItem), useValue: {} },
        { provide: AppLogger, useValue: { log: jest.fn(), error: jest.fn() } },
        { provide: 'PRODUCT_PACKAGE', useValue: {} },
        { provide: 'REDIS_CLIENT', useValue: { get: jest.fn(), setex: jest.fn() } },
      ],
    }).compile();

    service = module.get<OrderServiceService>(OrderServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create and save a new order', async () => {
      const mockOrderRepo = {
        create: jest.fn().mockReturnValue({ userId: 'user1', status: 'PENDING', totalAmount: 0 }),
        save: jest.fn().mockResolvedValue({ id: 'order1', userId: 'user1', status: 'PENDING', totalAmount: 0 })
      };
      service['orderRepo'] = mockOrderRepo as any;
      const result = await service.createOrder('user1');
      expect(mockOrderRepo.create).toHaveBeenCalledWith({ userId: 'user1', status: 'PENDING', totalAmount: 0 });
      expect(mockOrderRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'order1');
    });
  });

  describe('addItem', () => {
    it('should add a new item to an order', async () => {
      const mockOrder = { id: 'order1', items: [], totalAmount: 0 };
      const mockOrderRepo = {
        findOne: jest.fn().mockResolvedValue(mockOrder),
        save: jest.fn().mockResolvedValue(mockOrder)
      };
      const mockOrderItemRepo = {
        create: jest.fn().mockReturnValue({ sku: 'sku1', quantity: 2, unitPrice: 10, totalPrice: 20 }),
        save: jest.fn().mockResolvedValue({})
      };
      const mockProduct = { sku: 'sku1', price: 10, stock: 10 };
      service['orderRepo'] = mockOrderRepo as any;
      service['orderItemRepo'] = mockOrderItemRepo as any;
      service.getProductsByGrpc = jest.fn().mockResolvedValue({ items: [mockProduct] });
      service.mapProducts = jest.fn().mockResolvedValue([{ sku: 'sku1', price: 10 }]);
      const result = await service.addItem('order1', { sku: 'sku1', quantity: 2 });
      expect(result).toHaveProperty('message', 'Item added to order successfully');
      expect(mockOrderItemRepo.create).toHaveBeenCalled();
      expect(mockOrderItemRepo.save).toHaveBeenCalled();
      expect(mockOrderRepo.save).toHaveBeenCalled();
    });
    it('should throw if order not found', async () => {
      service['orderRepo'] = { findOne: jest.fn().mockResolvedValue(null) } as any;
      await expect(service.addItem('order1', { sku: 'sku1', quantity: 2 })).rejects.toThrow('Order not found');
    });
  });

  describe('completeOrder', () => {
    it('should complete an order if all checks pass', async () => {
      const mockOrder = { id: 'order1', items: [{ sku: 'sku1', quantity: 2, unitPrice: 10 }], status: 'PENDING' };
      const mockOrderRepo = {
        findOne: jest.fn().mockResolvedValue(mockOrder),
        save: jest.fn().mockResolvedValue({ ...mockOrder, status: 'COMPLETED' })
      };
      service['orderRepo'] = mockOrderRepo as any;
      service.getProductsByGrpc = jest.fn().mockResolvedValue({ items: [{ sku: 'sku1', price: 10, stock: 10 }] });
      const result = await service.completeOrder('order1');
      expect(result).toHaveProperty('message', 'Order completed successfully');
      expect(mockOrderRepo.save).toHaveBeenCalled();
    });
    it('should throw if order not found', async () => {
      service['orderRepo'] = { findOne: jest.fn().mockResolvedValue(null) } as any;
      await expect(service.completeOrder('order1')).rejects.toThrow('Order not found');
    });
    it('should throw if insufficient stock', async () => {
      const mockOrder = { id: 'order1', items: [{ sku: 'sku1', quantity: 2, unitPrice: 10 }] };
      service['orderRepo'] = { findOne: jest.fn().mockResolvedValue(mockOrder) } as any;
      service.getProductsByGrpc = jest.fn().mockResolvedValue({ items: [{ sku: 'sku1', price: 10, stock: 1 }] });
      await expect(service.completeOrder('order1')).rejects.toThrow('Insufficient stock for SKU sku1');
    });
  });

  describe('getCustomerOrders', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [{ id: 'order1' }, { id: 'order2' }];
      const mockOrderRepo = {
        count: jest.fn().mockResolvedValue(2),
        find: jest.fn().mockResolvedValue(mockOrders)
      };
      service['orderRepo'] = mockOrderRepo as any;
      const result = await service.getCustomerOrders('user1', { page: 1, limit: 2 }, 'customer');
      expect(result).toHaveProperty('orders');
      expect(result.orders.length).toBe(2);
      expect(result).toHaveProperty('total', 2);
    });
  });

  describe('getOrderDetail', () => {
    it('should return order details with mapped items', async () => {
      const mockOrder = { id: 'order1', items: [{ sku: 'sku1' }] };
      const mockOrderRepo = {
        findOne: jest.fn().mockResolvedValue(mockOrder)
      };
      service['orderRepo'] = mockOrderRepo as any;
      service.mapProducts = jest.fn().mockResolvedValue([{ sku: 'sku1', price: 10 }]);
      const result = await service.getOrderDetail('order1');
      expect(result).toHaveProperty('id', 'order1');
      expect(service.mapProducts).toHaveBeenCalled();
    });
    it('should throw if order not found', async () => {
      service['orderRepo'] = { findOne: jest.fn().mockResolvedValue(null) } as any;
      await expect(service.getOrderDetail('order1')).rejects.toThrow('Order not found');
    });
  });

  describe('getProductFromCache', () => {
    it('should return parsed product from cache', async () => {
      const mockRedis = { get: jest.fn().mockResolvedValue('{"sku":"sku1"}') };
      service['redisClient'] = mockRedis as any;
      const result = await service.getProductFromCache('sku1');
      expect(result).toHaveProperty('sku', 'sku1');
    });
    it('should return null if not in cache', async () => {
      const mockRedis = { get: jest.fn().mockResolvedValue(null) };
      service['redisClient'] = mockRedis as any;
      const result = await service.getProductFromCache('sku1');
      expect(result).toBeNull();
    });
  });

  describe('setProductCache', () => {
    it('should call redis setex and logger', async () => {
      const mockRedis = { setex: jest.fn() };
      const mockLogger = { log: jest.fn() };
      service['redisClient'] = mockRedis as any;
      service['logger'] = mockLogger as any;
      await service.setProductCache('sku1', { sku: 'sku1' });
      expect(mockLogger.log).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalled();
    });
  });
});
