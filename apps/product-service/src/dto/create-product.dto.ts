import { IsString, IsEnum, ValidateNested, IsArray,  IsOptional, IsObject, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { Brand, Category } from '../schema/product.schema';

export class CreateVariantDto {

  @IsString()
  sku: string;

  @IsNumber()
  price: number;

  @IsNumber()
  stock: number;
 
  @IsObject()
  @IsOptional()
  attributes: Record<string, any>;
}

export class CreateProductDto {

  @IsString()
  name: string;

  @IsEnum(Brand)
  brand: Brand;

  @IsEnum(Category)
  category: Category;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants: CreateVariantDto[];
}
