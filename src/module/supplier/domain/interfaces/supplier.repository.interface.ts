import { ISupplier } from '@/module/supplier/domain/interfaces/supplier.entity.interface.js';

export default interface ISupplierRepository {
  create(data: Partial<ISupplier>): Promise<ISupplier>;
  findById(id: string): Promise<ISupplier | null>;
  findByName(name: string, textileId?: string | null): Promise<ISupplier | null>;
  findAll(filter?: Record<string, any>): Promise<ISupplier[]>;
  update(id: string, data: Partial<ISupplier>): Promise<ISupplier | null>;
  delete(id: string): Promise<boolean>;
}
