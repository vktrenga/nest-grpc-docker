import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import  productData from './product.json';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductDto) {
    try {
      if (!dto.variants || dto.variants.length === 0) {
        dto.variants = [
          {
            sku: `SKU-${Date.now()}`,
            price: 0,
            stock: 0,
            attributes: {},
          },
        ];
      }
      // Check for existing variant SKUs
      for (const variant of dto.variants) {
        const exists = await this.productModel.findOne({
          'variants.sku': variant.sku,
        });
        if (exists) {
          throw new BadRequestException(
            `Variant with SKU '${variant.sku}' already exists.`,
          );
        }
      }
      const doc = await this.productModel.create(dto);
      return doc.toObject();
    } catch (error) {
      console.error('Product creation error:', error);
      throw error;
    }
  }

  async findAll(query: any = {}) {
    const { page, limit , ...filters } = query;
    const skip = (page - 1) * limit;
    const mongoFilters = { deleted: false, ...filters ,'variants.deleted': { $ne: true }};
    const products = await this.productModel
      .find(mongoFilters, { _id: 1, createdAt: 0, updatedAt: 0, __v: 0 })
      .skip(skip)
      .limit(Number(limit))
      .lean();
    const total = await this.productModel.countDocuments(mongoFilters);
    return {
      page: Number(page),
      limit: Number(limit),
      total,
      products,
    };
  }

  async findOne(id: string) {
    return this.productModel.findOne({ _id: id, deleted: false, 'variants.deleted': { $ne: true } }, { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }).lean();
  }

 async update(id: string, dto) {
  const product = await this.productModel.findById(id);
  if (!product) {
    throw new NotFoundException('Product not found');
  }

  if (dto.variants && dto.variants.length > 0) {
    for (const variantDto of dto.variants) {
      const existingVariant = product.variants.find(v => v.sku === variantDto.sku);

      if (existingVariant) {
        // Update fields of existing variant
        existingVariant.price = variantDto.price ?? existingVariant.price;
        existingVariant.stock = variantDto.stock ?? existingVariant.stock;
        existingVariant.attributes = variantDto.attributes ?? existingVariant.attributes;

        // Handle soft delete if specified
        if (typeof variantDto.deleted === 'boolean') {
          existingVariant.deleted = variantDto.deleted;
        }
      } else {
        // New variant: make sure SKU is unique across other products
        const skuExists = await this.productModel.findOne({
          'variants.sku': variantDto.sku,
          _id: { $ne: id },
        });
        if (skuExists) {
          throw new BadRequestException(`Variant with SKU '${variantDto.sku}' already exists.`);
        }
        product.variants.push({ ...variantDto, deleted: variantDto.deleted ?? false });
      }
    }
  }

  // Update other product fields
  product.name = dto.name ?? product.name;
  product.description = dto.description ?? product.description;
  product.brand = dto.brand ?? product.brand;
  product.category = dto.category ?? product.category;

  await product.save();
  return product.toObject();
}

  async delete(id: string) {
    // Soft delete: set the 'deleted' field to true
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    product.deleted = true;
    await product.save();
    return { message: 'Product soft deleted', id };
  }
  
  async getProductsBySkus(skus: string[]) {

  const products = await this.productModel
    .find({
      "variants.sku": { $in: skus }
    })
    .lean();

  const result: {
      "sku": string,
      "name": string,
      "category": string,
      "price": number,
      "productId": string
      } []= [];

  for (const product of products) {

    for (const variant of product.variants) {

      if (skus.includes(variant.sku)) {

        result.push({
          productId: product._id.toString(),
          sku: variant.sku,
          name: product.name,
          category: product.category,
          price: variant.price
        });

      }

    }

  }

  return result;
  }


   async insertProductsFromJSON(): Promise<any[]> {

    // Optional: avoid duplicate insertion
    const insertedProducts = await this.productModel.insertMany(productData, { ordered: false });
    return insertedProducts;
    
  }
}
