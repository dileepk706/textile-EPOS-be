import { ISalesInvoice } from '@/module/sales/domain/interfaces/sales-invoice.entity.interface.js';
import { ISaleItem } from '@/module/sales/domain/interfaces/sale-item.entity.interface.js';

export default interface ISalesRepository {
  // Sales Invoices
  createInvoice(data: Partial<ISalesInvoice>): Promise<ISalesInvoice>;
  findInvoiceById(id: string): Promise<ISalesInvoice | null>;
  findInvoiceByNumber(invoiceNumber: string, textileId?: string | null): Promise<ISalesInvoice | null>;
  findInvoices(
    filter?: Record<string, any>,
    options?: { skip?: number; limit?: number; sort?: Record<string, any> },
  ): Promise<ISalesInvoice[]>;
  countInvoices(filter?: Record<string, any>): Promise<number>;
  updateInvoice(id: string, data: Partial<ISalesInvoice>): Promise<ISalesInvoice | null>;
  deleteInvoice(id: string): Promise<boolean>;

  // Sales Line Items
  createSaleItems(items: Partial<ISaleItem>[]): Promise<ISaleItem[]>;
  findSaleItems(
    filter?: Record<string, any>,
    options?: { skip?: number; limit?: number; sort?: Record<string, any> },
  ): Promise<ISaleItem[]>;
  countSaleItems(filter?: Record<string, any>): Promise<number>;
  findSaleItemsByInvoiceId(invoiceId: string): Promise<ISaleItem[]>;
  findSaleItemById(id: string): Promise<ISaleItem | null>;

  // Sales Reports (Detailed List)
  getSalesReport(
    filter?: Record<string, any>,
    options?: { skip?: number; limit?: number; sort?: Record<string, any> },
  ): Promise<any[]>;
  countSalesReport(filter?: Record<string, any>): Promise<number>;
}
