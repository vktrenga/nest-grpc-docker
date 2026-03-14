import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product-service.service';
import { getModelToken } from '@nestjs/mongoose';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getModelToken('Product'), useValue: {} },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product with variants', async () => {
      const mockCreate = jest.fn().mockResolvedValue({ toObject: () => ({ name: 'Test', variants: [{ sku: 'sku1' }] }) });
      const mockFindOne = jest.fn().mockResolvedValue(null);
      service['productModel'] = { create: mockCreate, findOne: mockFindOne } as any;
      const dto = { name: 'Test', variants: [{ sku: 'sku1', price: 10, stock: 5, attributes: {} }] };
      const result = await service.create(dto as any);
      expect(result).toHaveProperty('name', 'Test');
      expect(mockCreate).toHaveBeenCalled();
    });
    it('should throw if variant SKU exists', async () => {
      const mockFindOne = jest.fn().mockResolvedValue({});
      service['productModel'] = { findOne: mockFindOne } as any;
      const dto = { name: 'Test', variants: [{ sku: 'sku1', price: 10, stock: 5, attributes: {} }] };
      await expect(service.create(dto as any)).rejects.toThrow('Variant with SKU');
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockFind = jest.fn().mockReturnValue({ skip: () => ({ limit: () => ({ lean: jest.fn().mockResolvedValue([{ _id: 1 }]) }) }) });
      const mockCount = jest.fn().mockResolvedValue(1);
      service['productModel'] = { find: mockFind, countDocuments: mockCount } as any;
      const result = await service.findAll({ page: 1, limit: 1 });
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('total', 1);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const mockLean = jest.fn().mockResolvedValue({ _id: 1 });
      const mockFindOne = jest.fn().mockReturnValue({ lean: mockLean });
      service['productModel'] = { findOne: mockFindOne } as any;
      const result = await service.findOne('1');
      expect(result).toHaveProperty('_id', 1);
      expect(mockFindOne).toHaveBeenCalled();
      expect(mockLean).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update product fields and variants', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockToObject = jest.fn().mockReturnValue({ name: 'Updated' });
      const product = { variants: [], save: mockSave, toObject: mockToObject };
      const mockFindById = jest.fn().mockResolvedValue(product);
      service['productModel'] = { findById: mockFindById, findOne: jest.fn().mockResolvedValue(null) } as any;
      const dto = { name: 'Updated', variants: [] };
      const result = await service.update('1', dto);
      expect(result).toHaveProperty('name', 'Updated');
      expect(mockSave).toHaveBeenCalled();
    });
    it('should throw if product not found', async () => {
      service['productModel'] = { findById: jest.fn().mockResolvedValue(null) } as any;
      await expect(service.update('1', { name: 'fail' })).rejects.toThrow('Product not found');
    });
    it('should throw if variant SKU exists in another product', async () => {
      const mockSave = jest.fn();
      const product = { variants: [], save: mockSave, toObject: jest.fn() };
      const mockFindById = jest.fn().mockResolvedValue(product);
      const mockFindOne = jest.fn().mockResolvedValue({});
      service['productModel'] = { findById: mockFindById, findOne: mockFindOne } as any;
      const dto = { name: 'fail', variants: [{ sku: 'sku1' }] };
      await expect(service.update('1', dto)).rejects.toThrow('Variant with SKU');
    });
  });

  describe('delete', () => {
    it('should call findByIdAndDelete', async () => {
      const mockDelete = jest.fn().mockResolvedValue({ _id: 1 });
      service['productModel'] = { findByIdAndDelete: mockDelete } as any;
      const result = await service.delete('1');
      expect(result).toHaveProperty('_id', 1);
      expect(mockDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('getProductsBySkus', () => {
    it('should return products by SKUs', async () => {
      const mockFind = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: '1', name: 'P', category: 'C', variants: [{ sku: 'sku1', price: 10 }] }] ) });
      service['productModel'] = { find: mockFind } as any;
      const result = await service.getProductsBySkus(['sku1']);
      expect(result[0]).toHaveProperty('sku', 'sku1');
    });
  });

  describe('insertProductsFromJSON', () => {
    it('should insert products from JSON', async () => {
      const mockInsertMany = jest.fn().mockResolvedValue([{ _id: 1 }]);
      service['productModel'] = { insertMany: mockInsertMany } as any;
      const result = await service.insertProductsFromJSON();
      expect(result[0]).toHaveProperty('_id', 1);
      expect(mockInsertMany).toHaveBeenCalled();
    });
  });
});
