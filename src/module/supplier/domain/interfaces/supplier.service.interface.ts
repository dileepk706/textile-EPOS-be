import { ISupplier } from '@/module/supplier/domain/interfaces/supplier.entity.interface.js';
import { CreateSupplierDto } from '@/module/supplier/application/dtos/create-supplier.dto.js';
import { UpdateSupplierDto } from '@/module/supplier/application/dtos/update-supplier.dto.js';

export interface SupplierContext {
  userId?: string;
  textileId?: string;
  tenantId?: string;
}

export default interface ISupplierService {
  createSupplier(data: CreateSupplierDto, context: SupplierContext): Promise<ISupplier>;
  getSuppliers(filter?: Record<string, any>, context?: SupplierContext): Promise<ISupplier[]>;
  getSupplierById(id: string): Promise<ISupplier>;
  updateSupplier(id: string, data: UpdateSupplierDto): Promise<ISupplier>;
  deleteSupplier(id: string): Promise<boolean>;
}
