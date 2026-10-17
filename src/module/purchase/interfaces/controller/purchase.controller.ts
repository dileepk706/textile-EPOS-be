import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { sendSuccess } from '@/shared/response_handler.js';
import IPurchaseController from '@/module/purchase/domain/interfaces/purchase.controller.interface.js';
import IPurchaseService, { PurchaseContext } from '@/module/purchase/domain/interfaces/purchase.service.interface.js';

@injectable()
export default class PurchaseController implements IPurchaseController {
  constructor(
    @inject('IPurchaseService') private readonly purchaseService: IPurchaseService,
  ) {}

  private getContext(req: Request): PurchaseContext {
    return {
      userId: req.user?.user_id ? String(req.user.user_id) : undefined,
      userName: req.user?.email ? String(req.user.email).split('@')[0] : 'Staff',
      textileId: (req.user?.textiles_id || req.user?.textile_id)
        ? String(req.user.textiles_id || req.user.textile_id)
        : undefined,
      tenantId: req.user?.tenant_id ? String(req.user.tenant_id) : undefined,
      tillId:
        (req.headers['x-till-id'] as string) ||
        (req.query.till_id as string) ||
        req.body?.till_id ||
        (req.headers['x-terminal-id'] as string) ||
        undefined,
    };
  }

  private getParamId(req: Request): string {
    return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  }

  createPurchase = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const result = await this.purchaseService.createPurchase(req.body, context);
    return sendSuccess(res, result, 'Purchase order and batch inventory created successfully', httpStatus.CREATED);
  };

  // ================= Invoices =================
  getInvoices = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const filter: Record<string, any> = {};

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { invoice_number: searchRegex },
        { supplier_invoice_number: searchRegex },
        { supplier_name: searchRegex },
        { batch_number: searchRegex },
      ];
    }
    if (req.query.payment_status) {
      filter.payment_status = String(req.query.payment_status).toUpperCase();
    }
    if (req.query.supplier_id) {
      filter.supplier_id = req.query.supplier_id;
    }
    if (req.query.startDate || req.query.endDate) {
      filter.purchase_date = {};
      if (req.query.startDate) filter.purchase_date.$gte = new Date(String(req.query.startDate));
      if (req.query.endDate) filter.purchase_date.$lte = new Date(String(req.query.endDate));
    }

    const invoices = await this.purchaseService.getInvoices(filter, context);
    return sendSuccess(res, { invoices, count: invoices.length }, 'Purchase invoices retrieved successfully', httpStatus.OK);
  };

  getInvoiceById = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const result = await this.purchaseService.getInvoiceById(id);
    return sendSuccess(res, result, 'Purchase invoice retrieved successfully', httpStatus.OK);
  };

  updateInvoice = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const invoice = await this.purchaseService.updateInvoice(id, req.body);
    return sendSuccess(res, { invoice }, 'Purchase invoice updated successfully', httpStatus.OK);
  };

  deleteInvoice = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    await this.purchaseService.deleteInvoice(id);
    return sendSuccess(res, {}, 'Purchase invoice cancelled successfully', httpStatus.OK);
  };

  // ================= Batches =================
  getBatches = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const filter: Record<string, any> = {};

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { batch_number: searchRegex },
        { supplier_name: searchRegex },
        { product_name: searchRegex },
        { barcode: searchRegex },
      ];
    }
    if (req.query.status) {
      filter.status = String(req.query.status).toUpperCase();
    }
    if (req.query.supplier_id) {
      filter.supplier_id = req.query.supplier_id;
    }
    if (req.query.product_id) {
      filter.product_id = req.query.product_id;
    }
    if (req.query.barcode) {
      filter.barcode = req.query.barcode;
    }
    if (req.query.till_id) {
      filter.till_id = req.query.till_id;
    }
    if (req.query.available_only === 'true') {
      filter.quantity_available = { $gt: 0 };
    }
    if (req.query.startDate || req.query.endDate) {
      filter.received_date = {};
      if (req.query.startDate) filter.received_date.$gte = new Date(String(req.query.startDate));
      if (req.query.endDate) filter.received_date.$lte = new Date(String(req.query.endDate));
    }

    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

    const result = await this.purchaseService.getBatches(filter, { page, limit }, context);
    return sendSuccess(res, result, 'Product batches retrieved successfully', httpStatus.OK);
  };

  getBatchById = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const batch = await this.purchaseService.getBatchById(id);
    return sendSuccess(res, { batch }, 'Product batch retrieved successfully', httpStatus.OK);
  };

  getBatchesByProductId = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    const batches = await this.purchaseService.getBatchesByProductId(productId, context);
    return sendSuccess(res, { batches, count: batches.length }, 'Product batches retrieved successfully', httpStatus.OK);
  };

  // ================= Purchase Reports =================
  getPurchaseReport = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const filter: Record<string, any> = {};

    if (req.query.supplier_id) {
      filter.supplier_id = req.query.supplier_id;
    }
    if (req.query.payment_status) {
      filter.payment_status = String(req.query.payment_status).toUpperCase();
    }
    if (req.query.payment_method) {
      filter.payment_method = String(req.query.payment_method).toUpperCase();
    }
    if (req.query.till_id) {
      filter.till_id = req.query.till_id;
    }
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { invoice_number: searchRegex },
        { supplier_invoice_number: searchRegex },
        { supplier_name: searchRegex },
      ];
    }
    if (req.query.startDate || req.query.endDate) {
      filter.purchase_date = {};
      if (req.query.startDate) filter.purchase_date.$gte = new Date(String(req.query.startDate));
      if (req.query.endDate) filter.purchase_date.$lte = new Date(String(req.query.endDate));
    }

    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

    const report = await this.purchaseService.getPurchaseReport(filter, { page, limit }, context);
    return sendSuccess(res, report, 'Purchase report generated successfully', httpStatus.OK);
  };

  // ================= Purchases (Line Items) =================
  getPurchases = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const filter: Record<string, any> = {};

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { product_name: searchRegex },
        { barcode: searchRegex },
        { invoice_number: searchRegex },
        { batch_number: searchRegex },
        { supplier_name: searchRegex },
      ];
    }
    if (req.query.product_id) filter.product_id = req.query.product_id;
    if (req.query.barcode) filter.barcode = req.query.barcode;
    if (req.query.supplier_id) filter.supplier_id = req.query.supplier_id;
    if (req.query.batch_id) filter.batch_id = req.query.batch_id;
    if (req.query.invoice_id) filter.invoice_id = req.query.invoice_id;

    const purchases = await this.purchaseService.getPurchases(filter, context);
    return sendSuccess(res, { purchases, count: purchases.length }, 'Purchases retrieved successfully', httpStatus.OK);
  };

  getPurchaseById = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const purchase = await this.purchaseService.getPurchaseById(id);
    return sendSuccess(res, { purchase }, 'Purchase record retrieved successfully', httpStatus.OK);
  };
}
