import { injectable } from 'tsyringe';
import ISalesRepository from '@/module/sales/domain/interfaces/sales.repository.interface.js';
import { ISalesInvoice } from '@/module/sales/domain/interfaces/sales-invoice.entity.interface.js';
import { ISaleItem } from '@/module/sales/domain/interfaces/sale-item.entity.interface.js';
import SalesInvoiceModel from '@/module/sales/infrastructure/sales-invoice.schema.js';
import SaleItemModel from '@/module/sales/infrastructure/sale-item.schema.js';

@injectable()
export default class SalesRepository implements ISalesRepository {
  // ================= Sales Invoices =================
  async createInvoice(data: Partial<ISalesInvoice>): Promise<ISalesInvoice> {
    const invoice = await SalesInvoiceModel.create(data);
    return invoice.toJSON() as ISalesInvoice;
  }

  async findInvoiceById(id: string): Promise<ISalesInvoice | null> {
    const invoice = await SalesInvoiceModel.findById(id);
    return invoice ? (invoice.toJSON() as ISalesInvoice) : null;
  }

  async findInvoiceByNumber(invoiceNumber: string, textileId?: string | null): Promise<ISalesInvoice | null> {
    const query: Record<string, any> = {
      invoice_number: invoiceNumber.trim(),
      deleted: 'false',
    };
    if (textileId) query.textile_id = textileId;
    const invoice = await SalesInvoiceModel.findOne(query);
    return invoice ? (invoice.toJSON() as ISalesInvoice) : null;
  }

  async findInvoices(
    filter: Record<string, any> = {},
    options: { skip?: number; limit?: number; sort?: Record<string, any> } = {},
  ): Promise<ISalesInvoice[]> {
    const query = SalesInvoiceModel.find(filter);
    if (options.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ sale_date: -1, createdAt: -1 });
    }
    if (options.skip !== undefined) {
      query.skip(options.skip);
    }
    if (options.limit !== undefined) {
      query.limit(options.limit);
    }
    const invoices = await query.exec();
    return invoices.map((inv) => inv.toJSON() as ISalesInvoice);
  }

  async countInvoices(filter: Record<string, any> = {}): Promise<number> {
    return SalesInvoiceModel.countDocuments(filter);
  }

  async updateInvoice(id: string, data: Partial<ISalesInvoice>): Promise<ISalesInvoice | null> {
    const updated = await SalesInvoiceModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    return updated ? (updated.toJSON() as ISalesInvoice) : null;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const result = await SalesInvoiceModel.findByIdAndUpdate(
      id,
      { $set: { deleted: 'true' } },
      { returnDocument: 'after' },
    );
    return !!result;
  }

  // ================= Sales Line Items =================
  async createSaleItems(items: Partial<ISaleItem>[]): Promise<ISaleItem[]> {
    const created = await SaleItemModel.insertMany(items);
    return created.map((item) => item.toJSON() as ISaleItem);
  }

  async findSaleItems(
    filter: Record<string, any> = {},
    options: { skip?: number; limit?: number; sort?: Record<string, any> } = {},
  ): Promise<ISaleItem[]> {
    const query = SaleItemModel.find(filter);
    if (options.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ createdAt: -1 });
    }
    if (options.skip !== undefined) {
      query.skip(options.skip);
    }
    if (options.limit !== undefined) {
      query.limit(options.limit);
    }
    const items = await query.exec();
    return items.map((item) => item.toJSON() as ISaleItem);
  }

  async countSaleItems(filter: Record<string, any> = {}): Promise<number> {
    return SaleItemModel.countDocuments(filter);
  }

  async findSaleItemsByInvoiceId(invoiceId: string): Promise<ISaleItem[]> {
    const items = await SaleItemModel.find({ invoice_id: invoiceId, deleted: 'false' }).sort({ createdAt: 1 });
    return items.map((item) => item.toJSON() as ISaleItem);
  }

  async findSaleItemById(id: string): Promise<ISaleItem | null> {
    const item = await SaleItemModel.findById(id);
    return item ? (item.toJSON() as ISaleItem) : null;
  }

  // ================= Sales Reports (Detailed List) =================
  async getSalesReport(
    filter: Record<string, any> = {},
    options: { skip?: number; limit?: number; sort?: Record<string, any> } = {},
  ): Promise<any[]> {
    const invoices = await this.findInvoices(filter, options);
    const invoiceIds = invoices.map((inv) => (inv.id || inv._id).toString());

    if (invoiceIds.length === 0) {
      return [];
    }

    // Fetch related line items
    const saleItems = await SaleItemModel.find({ invoice_id: { $in: invoiceIds }, deleted: 'false' }).lean();

    // Fetch unique product IDs, batch IDs, and till IDs to populate
    const productIds = saleItems
      .map((si) => si.product_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    const batchIds = saleItems
      .map((si) => si.batch_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    const tillIds = invoices
      .map((inv) => inv.till_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const ProductModel = (await import('@/module/product/infrastructure/product.schema.js')).default;
    const ProductBatchModel = (await import('@/module/purchase/infrastructure/product-batch.schema.js')).default;
    const TillModel = (await import('@/module/till/infrastructure/till.schema.js')).default;

    const [products, batches, tills] = await Promise.all([
      ProductModel.find({ _id: { $in: productIds } } as any).lean(),
      ProductBatchModel.find({ _id: { $in: batchIds } } as any).lean(),
      TillModel.find({ _id: { $in: tillIds } } as any).lean(),
    ]);

    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));
    const batchMap = new Map(batches.map((b: any) => [b._id.toString(), b]));
    const tillMap = new Map(tills.map((t: any) => [t._id.toString(), t]));

    // Group items by invoice_id
    const itemsByInvoice = new Map<string, any[]>();
    for (const item of saleItems) {
      const invId = item.invoice_id;
      if (!itemsByInvoice.has(invId)) itemsByInvoice.set(invId, []);
      const enrichedProduct = productMap.get(item.product_id?.toString()) || null;
      const enrichedBatch = batchMap.get(item.batch_id?.toString()) || null;

      itemsByInvoice.get(invId)!.push({
        ...item,
        id: item._id?.toString(),
        product: enrichedProduct,
        batch: enrichedBatch,
      });
    }

    return invoices.map((invoice) => {
      const invId = (invoice.id || invoice._id).toString();
      const till = invoice.till_id ? tillMap.get(invoice.till_id.toString()) || null : null;
      const items = itemsByInvoice.get(invId) || [];

      return {
        ...invoice,
        till,
        items,
      };
    });
  }

  async countSalesReport(filter: Record<string, any> = {}): Promise<number> {
    return SalesInvoiceModel.countDocuments({ deleted: 'false', ...filter });
  }
}
