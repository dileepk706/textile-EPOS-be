import { IPurchaseInvoice } from '@/module/purchase/domain/interfaces/purchase-invoice.entity.interface.js';
import { IProductBatch } from '@/module/purchase/domain/interfaces/product-batch.entity.interface.js';
import { IPurchase } from '@/module/purchase/domain/interfaces/purchase.entity.interface.js';

export default interface IPurchaseRepository {
  // Purchase Invoices
  createInvoice(data: Partial<IPurchaseInvoice>): Promise<IPurchaseInvoice>;
  findInvoiceById(id: string): Promise<IPurchaseInvoice | null>;
  findInvoiceByNumber(invoiceNumber: string, textileId?: string | null): Promise<IPurchaseInvoice | null>;
  findInvoices(filter?: Record<string, any>): Promise<IPurchaseInvoice[]>;
  updateInvoice(id: string, data: Partial<IPurchaseInvoice>): Promise<IPurchaseInvoice | null>;
  deleteInvoice(id: string): Promise<boolean>;

  // Product Batches (Inventory Lots)
  createBatch(data: Partial<IProductBatch>): Promise<IProductBatch>;
  createBatches(data: Partial<IProductBatch>[]): Promise<IProductBatch[]>;
  findBatchById(id: string): Promise<IProductBatch | null>;
  findBatchByNumber(batchNumber: string, textileId?: string | null): Promise<IProductBatch | null>;
  findBatches(filter?: Record<string, any>, options?: { skip?: number; limit?: number; sort?: Record<string, any> }): Promise<IProductBatch[]>;
  countBatches(filter?: Record<string, any>): Promise<number>;
  findBatchesByProductId(productId: string, textileId?: string | null): Promise<IProductBatch[]>;
  findBatchesByInvoiceId(invoiceId: string): Promise<IProductBatch[]>;
  updateBatch(id: string, data: Partial<IProductBatch>): Promise<IProductBatch | null>;

  // Reports
  getPurchaseReport(
    filter?: Record<string, any>,
    options?: { skip?: number; limit?: number; sort?: Record<string, any> },
  ): Promise<any[]>;
  countPurchaseReport(filter?: Record<string, any>): Promise<number>;

  // Purchases (Line items)
  createPurchase(data: Partial<IPurchase>): Promise<IPurchase>;
  createPurchases(data: Partial<IPurchase>[]): Promise<IPurchase[]>;
  findPurchaseById(id: string): Promise<IPurchase | null>;
  findPurchases(filter?: Record<string, any>): Promise<IPurchase[]>;
  findPurchasesByInvoiceId(invoiceId: string): Promise<IPurchase[]>;
  findPurchasesByBatchId(batchId: string): Promise<IPurchase[]>;
}
