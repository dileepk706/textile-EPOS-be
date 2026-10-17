import { injectable } from 'tsyringe';
import ProductModel from '@/module/product/infrastructure/product.schema.js';
import IProductRepository from '@/module/product/domain/interfaces/product.repository.interface.js';
import { IProduct } from '@/module/product/domain/interfaces/product.entity.interface.js';

@injectable()
export default class ProductRepository implements IProductRepository {
  async create(data: Partial<IProduct>): Promise<IProduct> {
    const product = await ProductModel.create(data);
    return product.toJSON() as IProduct;
  }

  async findById(id: string): Promise<IProduct | null> {
    const product = await ProductModel.findById(id);
    return product ? (product.toJSON() as IProduct) : null;
  }

  async findByBarcode(barcode: string, textileId?: string | null): Promise<IProduct | null> {
    const query: Record<string, any> = {
      barcode: barcode.trim(),
      deleted: 'false',
    };
    if (textileId) query.textile_id = textileId;
    const product = await ProductModel.findOne(query);
    return product ? (product.toJSON() as IProduct) : null;
  }

  async findAll(filter: Record<string, any> = {}): Promise<IProduct[]> {
    const products = await ProductModel.find(filter).sort({ name: 1 });
    return products.map((p) => p.toJSON() as IProduct);
  }

  async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    const updated = await ProductModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    return updated ? (updated.toJSON() as IProduct) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndUpdate(id, { $set: { deleted: 'true', is_active: false } });
    return !!result;
  }
}
