import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { sendSuccess } from '@/shared/response_handler.js';
import ISupplierController from '@/module/supplier/domain/interfaces/supplier.controller.interface.js';
import ISupplierService, { SupplierContext } from '@/module/supplier/domain/interfaces/supplier.service.interface.js';

@injectable()
export default class SupplierController implements ISupplierController {
  constructor(
    @inject('ISupplierService') private readonly supplierService: ISupplierService,
  ) {}

  private getContext(req: Request): SupplierContext {
    return {
      userId: req.user?.user_id ? String(req.user.user_id) : undefined,
      textileId: (req.user?.textiles_id || req.user?.textile_id) ? String(req.user.textiles_id || req.user.textile_id) : undefined,
      tenantId: req.user?.tenant_id ? String(req.user.tenant_id) : undefined,
    };
  }

  private getParamId(req: Request): string {
    return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  }

  createSupplier = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const supplier = await this.supplierService.createSupplier(req.body, context);
    return sendSuccess(res, { supplier }, 'Supplier created successfully', httpStatus.CREATED);
  };

  getSuppliers = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const filter: Record<string, any> = {};

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { contact_person: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { gstin: searchRegex },
      ];
    }
    if (req.query.is_active !== undefined) {
      filter.is_active = req.query.is_active === 'true';
    }

    const suppliers = await this.supplierService.getSuppliers(filter, context);
    return sendSuccess(res, { suppliers, count: suppliers.length }, 'Suppliers retrieved successfully', httpStatus.OK);
  };

  getSupplierById = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const supplier = await this.supplierService.getSupplierById(id);
    return sendSuccess(res, { supplier }, 'Supplier retrieved successfully', httpStatus.OK);
  };

  updateSupplier = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const supplier = await this.supplierService.updateSupplier(id, req.body);
    return sendSuccess(res, { supplier }, 'Supplier updated successfully', httpStatus.OK);
  };

  deleteSupplier = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    await this.supplierService.deleteSupplier(id);
    return sendSuccess(res, {}, 'Supplier deleted successfully', httpStatus.OK);
  };
}
