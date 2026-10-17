import { injectable } from 'tsyringe';
import IPurchaseRepository from '@/module/purchase/domain/interfaces/purchase.repository.interface.js';
import { IPurchaseInvoice } from '@/module/purchase/domain/interfaces/purchase-invoice.entity.interface.js';
import { IProductBatch } from '@/module/purchase/domain/interfaces/product-batch.entity.interface.js';
import { IPurchase } from '@/module/purchase/domain/interfaces/purchase.entity.interface.js';
import PurchaseInvoiceModel from '@/module/purchase/infrastructure/purchase-invoice.schema.js';
import ProductBatchModel from '@/module/purchase/infrastructure/product-batch.schema.js';
import PurchaseModel from '@/module/purchase/infrastructure/purchase.schema.js';

@injectable()
export default class PurchaseRepository implements IPurchaseRepository {
  // ================= Purchase Invoices =================
  async createInvoice(data: Partial<IPurchaseInvoice>): Promise<IPurchaseInvoice> {
    const invoice = await PurchaseInvoiceModel.create(data);
    return invoice.toJSON() as IPurchaseInvoice;
  }

  async findInvoiceById(id: string): Promise<IPurchaseInvoice | null> {
    const invoice = await PurchaseInvoiceModel.findById(id);
    return invoice ? (invoice.toJSON() as IPurchaseInvoice) : null;
  }

  async findInvoiceByNumber(invoiceNumber: string, textileId?: string | null): Promise<IPurchaseInvoice | null> {
    const query: Record<string, any> = {
      invoice_number: invoiceNumber.trim(),
      deleted: 'false',
    };
    if (textileId) query.textile_id = textileId;
    const invoice = await PurchaseInvoiceModel.findOne(query);
    return invoice ? (invoice.toJSON() as IPurchaseInvoice) : null;
  }

  async findInvoices(
    filter: Record<string, any> = {},
    options: { skip?: number; limit?: number; sort?: Record<string, any> } = {},
  ): Promise<IPurchaseInvoice[]> {
    const query = PurchaseInvoiceModel.find(filter);
    if (options.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ purchase_date: -1, createdAt: -1 });
    }
    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);
    const invoices = await query.exec();
    return invoices.map((inv) => inv.toJSON() as IPurchaseInvoice);
  }

  async updateInvoice(id: string, data: Partial<IPurchaseInvoice>): Promise<IPurchaseInvoice | null> {
    const updated = await PurchaseInvoiceModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    return updated ? (updated.toJSON() as IPurchaseInvoice) : null;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const result = await PurchaseInvoiceModel.findByIdAndUpdate(
      id,
      { $set: { deleted: 'true' } },
      { returnDocument: 'after' },
    );
    return !!result;
  }

  // ================= Product Batches =================
  async createBatch(data: Partial<IProductBatch>): Promise<IProductBatch> {
    const batch = await ProductBatchModel.create(data);
    return batch.toJSON() as IProductBatch;
  }

  async createBatches(data: Partial<IProductBatch>[]): Promise<IProductBatch[]> {
    const batches = await ProductBatchModel.insertMany(data);
    return batches.map((b) => b.toJSON() as IProductBatch);
  }

  async findBatchById(id: string): Promise<IProductBatch | null> {
    const batch = await ProductBatchModel.findById(id);
    return batch ? (batch.toJSON() as IProductBatch) : null;
  }

  async findBatchByNumber(batchNumber: string, textileId?: string | null): Promise<IProductBatch | null> {
    const query: Record<string, any> = {
      batch_number: batchNumber.trim(),
      deleted: 'false',
    };
    if (textileId) query.textile_id = textileId;
    const batch = await ProductBatchModel.findOne(query);
    return batch ? (batch.toJSON() as IProductBatch) : null;
  }

  async findBatches(
    filter: Record<string, any> = {},
    options: { skip?: number; limit?: number; sort?: Record<string, any> } = {},
  ): Promise<IProductBatch[]> {
    const query = ProductBatchModel.find(filter);
    if (options.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ received_date: -1, createdAt: -1 });
    }
    if (options.skip !== undefined) {
      query.skip(options.skip);
    }
    if (options.limit !== undefined) {
      query.limit(options.limit);
    }
    const batches = await query.exec();
    return batches.map((b) => b.toJSON() as IProductBatch);
  }

  async countBatches(filter: Record<string, any> = {}): Promise<number> {
    return ProductBatchModel.countDocuments(filter);
  }

  async findBatchesByProductId(productId: string, textileId?: string | null): Promise<IProductBatch[]> {
    const query: Record<string, any> = {
      product_id: productId,
      quantity_available: { $gt: 0 },
      status: 'ACTIVE',
      deleted: 'false',
    };
    if (textileId) query.textile_id = textileId;
    const batches = await ProductBatchModel.find(query).sort({ received_date: 1 }); // FIFO
    return batches.map((b) => b.toJSON() as IProductBatch);
  }

  async findBatchesByInvoiceId(invoiceId: string): Promise<IProductBatch[]> {
    const batches = await ProductBatchModel.find({ invoice_id: invoiceId, deleted: 'false' }).sort({ createdAt: 1 });
    return batches.map((b) => b.toJSON() as IProductBatch);
  }

  async updateBatch(id: string, data: Partial<IProductBatch>): Promise<IProductBatch | null> {
    const updated = await ProductBatchModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    return updated ? (updated.toJSON() as IProductBatch) : null;
  }

  // ================= Purchases (Line Items) =================
  async createPurchase(data: Partial<IPurchase>): Promise<IPurchase> {
    const purchase = await PurchaseModel.create(data);
    return purchase.toJSON() as IPurchase;
  }

  async createPurchases(data: Partial<IPurchase>[]): Promise<IPurchase[]> {
    const purchases = await PurchaseModel.insertMany(data);
    return purchases.map((p) => p.toJSON() as IPurchase);
  }

  async findPurchaseById(id: string): Promise<IPurchase | null> {
    const purchase = await PurchaseModel.findById(id);
    return purchase ? (purchase.toJSON() as IPurchase) : null;
  }

  async findPurchases(filter: Record<string, any> = {}): Promise<IPurchase[]> {
    const purchases = await PurchaseModel.find(filter).sort({ createdAt: -1 });
    return purchases.map((p) => p.toJSON() as IPurchase);
  }

  async findPurchasesByInvoiceId(invoiceId: string): Promise<IPurchase[]> {
    const purchases = await PurchaseModel.find({ invoice_id: invoiceId, deleted: 'false' }).sort({ createdAt: 1 });
    return purchases.map((p) => p.toJSON() as IPurchase);
  }

  async findPurchasesByBatchId(batchId: string): Promise<IPurchase[]> {
    const purchases = await PurchaseModel.find({ batch_id: batchId, deleted: 'false' }).sort({ createdAt: 1 });
    return purchases.map((p) => p.toJSON() as IPurchase);
  }

  // ================= Purchase Reports (Detailed List) =================
  async getPurchaseReport(
    filter: Record<string, any> = {},
    options: { skip?: number; limit?: number; sort?: Record<string, any> } = {},
  ): Promise<any[]> {
    const invoices = await this.findInvoices(filter, options);
    const invoiceIds = invoices.map((inv) => (inv.id || inv._id).toString());

    if (invoiceIds.length === 0) {
      return [];
    }

    // Fetch related line items and batches in bulk
    const purchases = await PurchaseModel.find({ invoice_id: { $in: invoiceIds }, deleted: 'false' }).lean();
    const batches = await ProductBatchModel.find({ invoice_id: { $in: invoiceIds }, deleted: 'false' }).lean();

    // Collect IDs for supplier, products, and tills to populate
    const supplierIds = invoices
      .map((i) => i.supplier_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    const productIds = purchases
      .map((p) => p.product_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    const tillIds = invoices
      .map((i) => i.till_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    const SupplierModel = (await import('@/module/supplier/infrastructure/supplier.schema.js')).default;
    const ProductModel = (await import('@/module/product/infrastructure/product.schema.js')).default;
    const TillModel = (await import('@/module/till/infrastructure/till.schema.js')).default;

    const [suppliers, products, tills] = await Promise.all([
      SupplierModel.find({ _id: { $in: supplierIds } } as any).lean(),
      ProductModel.find({ _id: { $in: productIds } } as any).lean(),
      TillModel.find({ _id: { $in: tillIds } } as any).lean(),
    ]);

    const supplierMap = new Map(suppliers.map((s: any) => [s._id.toString(), s]));
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));
    const tillMap = new Map(tills.map((t: any) => [t._id.toString(), t]));

    // Group purchases and batches by invoice_id
    const purchasesByInvoice = new Map<string, any[]>();
    for (const p of purchases) {
      const invId = p.invoice_id;
      if (!purchasesByInvoice.has(invId)) purchasesByInvoice.set(invId, []);
      const enrichedProduct = productMap.get(p.product_id?.toString()) || null;
      purchasesByInvoice.get(invId)!.push({
        ...p,
        id: p._id?.toString(),
        product: enrichedProduct,
      });
    }

    const batchesByInvoice = new Map<string, any[]>();
    for (const b of batches) {
      const invId = b.invoice_id;
      if (!batchesByInvoice.has(invId)) batchesByInvoice.set(invId, []);
      const enrichedProduct = productMap.get(b.product_id?.toString()) || null;
      batchesByInvoice.get(invId)!.push({
        ...b,
        id: b._id?.toString(),
        product: enrichedProduct,
      });
    }

    return invoices.map((invoice) => {
      const invId = (invoice.id || invoice._id).toString();
      const supplier = supplierMap.get(invoice.supplier_id?.toString()) || null;
      const till = invoice.till_id ? tillMap.get(invoice.till_id.toString()) || null : null;
      const invoicePurchases = purchasesByInvoice.get(invId) || [];
      const invoiceBatches = batchesByInvoice.get(invId) || [];

      return {
        ...invoice,
        supplier,
        till,
        items: invoicePurchases,
        batches: invoiceBatches,
      };
    });
  }

  async countPurchaseReport(filter: Record<string, any> = {}): Promise<number> {
    return PurchaseInvoiceModel.countDocuments({ deleted: 'false', ...filter });
  }
}
