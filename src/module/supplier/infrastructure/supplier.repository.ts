import { injectable } from 'tsyringe';
import SupplierModel from '@/module/supplier/infrastructure/supplier.schema.js';
import ISupplierRepository from '@/module/supplier/domain/interfaces/supplier.repository.interface.js';
import { ISupplier } from '@/module/supplier/domain/interfaces/supplier.entity.interface.js';

@injectable()
export default class SupplierRepository implements ISupplierRepository {
  async create(data: Partial<ISupplier>): Promise<ISupplier> {
    const supplier = await SupplierModel.create(data);
    return supplier.toJSON() as ISupplier;
  }

  async findById(id: string): Promise<ISupplier | null> {
    const supplier = await SupplierModel.findById(id);
    return supplier ? (supplier.toJSON() as ISupplier) : null;
  }

  async findByName(name: string, textileId?: string | null): Promise<ISupplier | null> {
    const query: Record<string, any> = {
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      deleted: 'false',
    };
    if (textileId) query.textile_id = textileId;
    const supplier = await SupplierModel.findOne(query);
    return supplier ? (supplier.toJSON() as ISupplier) : null;
  }

  async findAll(filter: Record<string, any> = {}): Promise<ISupplier[]> {
    const suppliers = await SupplierModel.find(filter).sort({ name: 1 });
    return suppliers.map((s) => s.toJSON() as ISupplier);
  }

  async update(id: string, data: Partial<ISupplier>): Promise<ISupplier | null> {
    const updated = await SupplierModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    return updated ? (updated.toJSON() as ISupplier) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await SupplierModel.findByIdAndUpdate(id, { $set: { deleted: 'true', is_active: false } });
    return !!result;
  }
}
