import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { randomUUID } from 'crypto';

export type ProductDocument = Product & Document;

export enum Brand {
  NIKE = 'NIKE',
  APPLE = 'APPLE',
  SAMSUNG = 'SAMSUNG'
}

export enum Category {
  SHOES = 'SHOES',
  MOBILE = 'MOBILE',
  ACCESSORIES = 'ACCESSORIES'
}

@Schema({ _id: false })
export class Variant {

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ type: Object })
  attributes: Record<string, any>;
}

const VariantSchema = SchemaFactory.createForClass(Variant);
@Schema({ timestamps: true, strict: true })
export class Product {

  @Prop({ default: () => randomUUID() })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ enum: Brand, required: true })
  brand: Brand;

  @Prop({ enum: Category, required: true })
  category: Category;

  @Prop({ type: [VariantSchema], default: [] })
  variants: Variant[];

  @Prop({ default: false })
  deleted: boolean;

}

export const ProductSchema = SchemaFactory.createForClass(Product);