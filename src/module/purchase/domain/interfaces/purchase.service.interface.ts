import { IPurchaseInvoice } from '@/module/purchase/domain/interfaces/purchase-invoice.entity.interface.js';
import { IProductBatch } from '@/module/purchase/domain/interfaces/product-batch.entity.interface.js';
import { IPurchase } from '@/module/purchase/domain/interfaces/purchase.entity.interface.js';
import { CreatePurchaseDto } from '@/module/purchase/application/dtos/create-purchase.dto.js';
import { UpdatePurchaseInvoiceDto } from '@/module/purchase/application/dtos/update-purchase.dto.js';

export interface PurchaseContext {
  userId?: string;
  userName?: string;
  textileId?: string;
  tenantId?: string;
  tillId?: string;
}

export interface PurchaseSummaryResult {
  invoice: IPurchaseInvoice;
  batches: IProductBatch[];
  purchases: IPurchase[];
}

export interface PurchaseInvoiceDetailsResult {
  invoice: IPurchaseInvoice & {
    supplier?: any;
    till?: any;
  };
  batches: Array<IProductBatch & { product?: any }>;
  items: Array<IPurchase & { product?: any }>;
}

export default interface IPurchaseService {
  createPurchase(data: CreatePurchaseDto, context: PurchaseContext): Promise<PurchaseSummaryResult>;

  // Invoices
  getInvoices(filter?: Record<string, any>, context?: PurchaseContext): Promise<IPurchaseInvoice[]>;
  getInvoiceById(id: string): Promise<PurchaseInvoiceDetailsResult>;
  updateInvoice(id: string, data: UpdatePurchaseInvoiceDto): Promise<IPurchaseInvoice>;
  deleteInvoice(id: string): Promise<boolean>;

  // Batches
  getBatches(
    filter?: Record<string, any>,
    options?: { page?: number; limit?: number; sort?: Record<string, any> },
    context?: PurchaseContext,
  ): Promise<{
    batches: IProductBatch[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  getBatchById(id: string): Promise<IProductBatch>;
  getBatchesByProductId(productId: string, context?: PurchaseContext): Promise<IProductBatch[]>;

  // Reports
  getPurchaseReport(
    filter?: Record<string, any>,
    options?: { page?: number; limit?: number; sort?: Record<string, any> },
    context?: PurchaseContext,
  ): Promise<{
    purchases: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
      total_purchases_count: number;
      total_amount: number;
      total_tax: number;
      total_discount: number;
      net_amount: number;
      total_paid: number;
      balance_amount: number;
      total_quantity: number;
    };
  }>;

  // Line items
  getPurchases(filter?: Record<string, any>, context?: PurchaseContext): Promise<IPurchase[]>;
  getPurchaseById(id: string): Promise<IPurchase>;
}
