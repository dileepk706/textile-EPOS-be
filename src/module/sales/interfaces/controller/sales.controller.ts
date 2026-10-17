import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { sendSuccess } from '@/shared/response_handler.js';
import ISalesController from '@/module/sales/domain/interfaces/sales.controller.interface.js';
import ISalesService, { SalesContext } from '@/module/sales/domain/interfaces/sales.service.interface.js';

@injectable()
export default class SalesController implements ISalesController {
  constructor(
    @inject('ISalesService') private readonly salesService: ISalesService,
  ) {}

  private getContext(req: Request): SalesContext {
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

  createSale = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const result = await this.salesService.createSale(req.body, context);
    return sendSuccess(res, result, 'Sale completed and receipt generated successfully', httpStatus.CREATED);
  };

  // ================= Invoices =================
  getInvoices = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const filter: Record<string, any> = {};

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { invoice_number: searchRegex },
        { staff_name: searchRegex },
      ];
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
    if (req.query.staff_id) {
      filter.staff_id = req.query.staff_id;
    }
    if (req.query.startDate || req.query.endDate) {
      filter.sale_date = {};
      if (req.query.startDate) filter.sale_date.$gte = new Date(String(req.query.startDate));
      if (req.query.endDate) filter.sale_date.$lte = new Date(String(req.query.endDate));
    }

    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

    const result = await this.salesService.getInvoices(filter, { page, limit }, context);
    return sendSuccess(res, result, 'Sales invoices retrieved successfully', httpStatus.OK);
  };

  getInvoiceById = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const result = await this.salesService.getInvoiceById(id);
    return sendSuccess(res, result, 'Sales invoice details retrieved successfully', httpStatus.OK);
  };

  cancelInvoice = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    await this.salesService.cancelInvoice(id);
    return sendSuccess(res, {}, 'Sales invoice cancelled and inventory restored successfully', httpStatus.OK);
  };

  // ================= Transactions (Line Items) =================
  getTransactions = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const filter: Record<string, any> = {};

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { invoice_number: searchRegex },
        { product_name: searchRegex },
        { barcode: searchRegex },
        { batch_number: searchRegex },
      ];
    }
    if (req.query.product_id) filter.product_id = req.query.product_id;
    if (req.query.batch_id) filter.batch_id = req.query.batch_id;
    if (req.query.invoice_id) filter.invoice_id = req.query.invoice_id;
    if (req.query.till_id) filter.till_id = req.query.till_id;
    if (req.query.barcode) filter.barcode = req.query.barcode;

    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

    const result = await this.salesService.getSaleItems(filter, { page, limit }, context);
    return sendSuccess(res, result, 'Sales transaction items retrieved successfully', httpStatus.OK);
  };

  getTransactionById = async (req: Request, res: Response) => {
    const id = this.getParamId(req);
    const transaction = await this.salesService.getSaleItemById(id);
    return sendSuccess(res, { transaction }, 'Sales transaction item retrieved successfully', httpStatus.OK);
  };

  // ================= Reports =================
  getSalesReport = async (req: Request, res: Response) => {
    const context = this.getContext(req);
    const filter: Record<string, any> = {};

    if (req.query.payment_status) {
      filter.payment_status = String(req.query.payment_status).toUpperCase();
    }
    if (req.query.payment_method) {
      filter.payment_method = String(req.query.payment_method).toUpperCase();
    }
    if (req.query.till_id) {
      filter.till_id = req.query.till_id;
    }
    if (req.query.staff_id) {
      filter.staff_id = req.query.staff_id;
    }
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { invoice_number: searchRegex },
        { staff_name: searchRegex },
      ];
    }
    if (req.query.startDate || req.query.endDate) {
      filter.sale_date = {};
      if (req.query.startDate) filter.sale_date.$gte = new Date(String(req.query.startDate));
      if (req.query.endDate) filter.sale_date.$lte = new Date(String(req.query.endDate));
    }

    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

    const report = await this.salesService.getSalesReport(filter, { page, limit }, context);
    return sendSuccess(res, report, 'Sales report generated successfully', httpStatus.OK);
  };
}
