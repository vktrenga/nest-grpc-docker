import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';

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
    const { page = 1, limit = 10, ...filters } = query;
    const skip = (page - 1) * limit;
    const mongoFilters = { deleted: false, ...filters };
    const products = await this.productModel
      .find(mongoFilters, { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
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
    return this.productModel.findOne({ _id: id, deleted: false }, { _id: 0, createdAt: 0, updatedAt: 0, __v: 0 }).lean();
  }

  async update(id: string, dto) {
    // Validate variant SKUs if present
    if (dto.variants && dto.variants.length > 0) {
      for (const variant of dto.variants) {
        const exists = await this.productModel.findOne({
          'variants.sku': variant.sku,
          _id: { $ne: id },
        });
        if (exists) {
          throw new BadRequestException(
            `Variant with SKU '${variant.sku}' already exists.`,
          );
        }
      }
    }
    const updated = await this.productModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean();
    if (!updated) {
      throw new NotFoundException('Product not found');
    }
    return updated;
  }

  async delete(id: string) {
    return this.productModel.findByIdAndDelete(id);
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

}
