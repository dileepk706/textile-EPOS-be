import { IProduct } from '@/module/product/domain/interfaces/product.entity.interface.js';
import { CreateProductDto } from '@/module/product/application/dtos/create-product.dto.js';
import { UpdateProductDto } from '@/module/product/application/dtos/update-product.dto.js';

export interface ProductContext {
  userId?: string;
  textileId?: string;
  tenantId?: string;
}

export default interface IProductService {
  createProduct(data: CreateProductDto, context: ProductContext): Promise<IProduct>;
  getProducts(filter?: Record<string, any>, context?: ProductContext): Promise<IProduct[]>;
  getProductById(id: string): Promise<IProduct>;
  getProductByBarcode(barcode: string, context?: ProductContext): Promise<IProduct>;
  updateProduct(id: string, data: UpdateProductDto): Promise<IProduct>;
  deleteProduct(id: string): Promise<boolean>;
}
