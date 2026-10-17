import { IProduct } from '@/module/product/domain/interfaces/product.entity.interface.js';

export default interface IProductRepository {
  create(data: Partial<IProduct>): Promise<IProduct>;
  findById(id: string): Promise<IProduct | null>;
  findByBarcode(barcode: string, textileId?: string | null): Promise<IProduct | null>;
  findAll(filter?: Record<string, any>): Promise<IProduct[]>;
  update(id: string, data: Partial<IProduct>): Promise<IProduct | null>;
  delete(id: string): Promise<boolean>;
}
