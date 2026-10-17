import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { ApiError } from '@/shared/middleware/error_handler.js';
import ISupplierRepository from '@/module/supplier/domain/interfaces/supplier.repository.interface.js';
import ISupplierService, { SupplierContext } from '@/module/supplier/domain/interfaces/supplier.service.interface.js';
import { ISupplier } from '@/module/supplier/domain/interfaces/supplier.entity.interface.js';
import { CreateSupplierDto } from '@/module/supplier/application/dtos/create-supplier.dto.js';
import { UpdateSupplierDto } from '@/module/supplier/application/dtos/update-supplier.dto.js';
import TextileModel from '@/module/textile/infrastructure/textile.schema.js';

@injectable()
export default class SupplierService implements ISupplierService {
  constructor(
    @inject('ISupplierRepository') private readonly supplierRepository: ISupplierRepository,
  ) {}

  private async resolveTextileId(contextTextileId?: string): Promise<string | null> {
    if (contextTextileId) return contextTextileId;
    const defaultTextile = await TextileModel.findOne({ is_active: true });
    return defaultTextile ? defaultTextile._id.toString() : null;
  }

  async createSupplier(data: CreateSupplierDto, context: SupplierContext): Promise<ISupplier> {
    const textileId = await this.resolveTextileId(context.textileId || data.textile_id || undefined);

    const existing = await this.supplierRepository.findByName(data.name, textileId);
    if (existing) {
      throw new ApiError(`Supplier with name '${data.name}' already exists`, httpStatus.CONFLICT);
    }

    const payload: Partial<ISupplier> = {
      name: data.name.trim(),
      contact_person: data.contact_person?.trim() || '',
      phone: data.phone?.trim() || '',
      email: data.email?.trim().toLowerCase() || '',
      address: data.address?.trim() || '',
      gstin: data.gstin?.trim().toUpperCase() || '',
      deleted: data.deleted || 'false',
      is_active: data.is_active !== undefined ? data.is_active : true,
      textile_id: textileId,
      tenant_id: context.tenantId || textileId,
    };

    return this.supplierRepository.create(payload);
  }

  async getSuppliers(filter: Record<string, any> = {}, context?: SupplierContext): Promise<ISupplier[]> {
    const query: Record<string, any> = { deleted: 'false', ...filter };
    const textileId = await this.resolveTextileId(context?.textileId);
    if (textileId && !query.textile_id) {
      query.textile_id = textileId;
    }
    return this.supplierRepository.findAll(query);
  }

  async getSupplierById(id: string): Promise<ISupplier> {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier || supplier.deleted === 'true') {
      throw new ApiError(`Supplier with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }
    return supplier;
  }

  async updateSupplier(id: string, data: UpdateSupplierDto): Promise<ISupplier> {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier || supplier.deleted === 'true') {
      throw new ApiError(`Supplier with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    if (data.name && data.name.trim().toLowerCase() !== supplier.name.toLowerCase()) {
      const conflict = await this.supplierRepository.findByName(data.name, supplier.textile_id);
      if (conflict && (conflict.id !== id && conflict._id !== id)) {
        throw new ApiError(`Supplier with name '${data.name}' already exists`, httpStatus.CONFLICT);
      }
    }

    const updatePayload: Partial<ISupplier> = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.contact_person !== undefined) updatePayload.contact_person = data.contact_person.trim();
    if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
    if (data.email !== undefined) updatePayload.email = data.email.trim().toLowerCase();
    if (data.address !== undefined) updatePayload.address = data.address.trim();
    if (data.gstin !== undefined) updatePayload.gstin = data.gstin.trim().toUpperCase();
    if (data.is_active !== undefined) updatePayload.is_active = data.is_active;
    if (data.deleted !== undefined) updatePayload.deleted = data.deleted;

    const updated = await this.supplierRepository.update(id, updatePayload);
    if (!updated) {
      throw new ApiError('Failed to update supplier', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const supplier = await this.supplierRepository.findById(id);
    if (!supplier || supplier.deleted === 'true') {
      throw new ApiError(`Supplier with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }
    return this.supplierRepository.delete(id);
  }
}
