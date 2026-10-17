import { ISalesInvoice } from '@/module/sales/domain/interfaces/sales-invoice.entity.interface.js';
import { ISaleItem } from '@/module/sales/domain/interfaces/sale-item.entity.interface.js';
import { CreateSaleDto } from '@/module/sales/application/dtos/create-sale.dto.js';

export interface SalesContext {
  userId?: string;
  userName?: string;
  textileId?: string;
  tenantId?: string;
  tillId?: string;
}

export interface SaleSummaryResult {
  invoice: ISalesInvoice;
  items: ISaleItem[];
}

export interface SaleInvoiceDetailsResult {
  invoice: ISalesInvoice & {
    till?: any;
  };
  items: Array<ISaleItem & { product?: any; batch?: any }>;
}

export default interface ISalesService {
  createSale(data: CreateSaleDto, context: SalesContext): Promise<SaleSummaryResult>;

  // Invoices
  getInvoices(
    filter?: Record<string, any>,
    options?: { page?: number; limit?: number; sort?: Record<string, any> },
    context?: SalesContext,
  ): Promise<{
    invoices: ISalesInvoice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  getInvoiceById(id: string): Promise<SaleInvoiceDetailsResult>;
  cancelInvoice(id: string): Promise<boolean>;

  // Line items (Transactions)
  getSaleItems(
    filter?: Record<string, any>,
    options?: { page?: number; limit?: number; sort?: Record<string, any> },
    context?: SalesContext,
  ): Promise<{
    transactions: ISaleItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  getSaleItemById(id: string): Promise<ISaleItem>;

  // Reports (Detailed List)
  getSalesReport(
    filter?: Record<string, any>,
    options?: { page?: number; limit?: number; sort?: Record<string, any> },
    context?: SalesContext,
  ): Promise<{
    sales: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
      total_sales_count: number;
      total_amount: number;
      total_tax: number;
      total_discount: number;
      net_amount: number;
      total_paid: number;
      balance_amount: number;
      total_quantity: number;
    };
  }>;
}
