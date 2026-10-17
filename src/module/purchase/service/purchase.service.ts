import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { ApiError } from '@/shared/middleware/error_handler.js';
import IPurchaseRepository from '@/module/purchase/domain/interfaces/purchase.repository.interface.js';
import IPurchaseService, {
  PurchaseContext,
  PurchaseSummaryResult,
  PurchaseInvoiceDetailsResult,
} from '@/module/purchase/domain/interfaces/purchase.service.interface.js';
import { IPurchaseInvoice, PaymentStatus } from '@/module/purchase/domain/interfaces/purchase-invoice.entity.interface.js';
import { IProductBatch } from '@/module/purchase/domain/interfaces/product-batch.entity.interface.js';
import { IPurchase } from '@/module/purchase/domain/interfaces/purchase.entity.interface.js';
import { CreatePurchaseDto } from '@/module/purchase/application/dtos/create-purchase.dto.js';
import { UpdatePurchaseInvoiceDto } from '@/module/purchase/application/dtos/update-purchase.dto.js';
import ISupplierRepository from '@/module/supplier/domain/interfaces/supplier.repository.interface.js';
import IProductRepository from '@/module/product/domain/interfaces/product.repository.interface.js';
import ITillRepository from '@/module/till/domain/interfaces/till.repository.interface.js';
import TextileModel from '@/module/textile/infrastructure/textile.schema.js';

@injectable()
export default class PurchaseService implements IPurchaseService {
  constructor(
    @inject('IPurchaseRepository') private readonly purchaseRepository: IPurchaseRepository,
    @inject('ISupplierRepository') private readonly supplierRepository: ISupplierRepository,
    @inject('IProductRepository') private readonly productRepository: IProductRepository,
    @inject('ITillRepository') private readonly tillRepository: ITillRepository,
  ) {}

  private async resolveTextileId(contextTextileId?: string): Promise<string | null> {
    if (contextTextileId) return contextTextileId;
    const defaultTextile = await TextileModel.findOne({ is_active: true });
    return defaultTextile ? defaultTextile._id.toString() : null;
  }

  private generateInvoiceNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `PINV-${dateStr}-${random}`;
  }

  private generateBatchNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `BATCH-${dateStr}-${random}`;
  }

  async createPurchase(data: CreatePurchaseDto, context: PurchaseContext): Promise<PurchaseSummaryResult> {
    const textileId = await this.resolveTextileId(context.textileId);

    // 1. Verify Supplier
    const supplier = await this.supplierRepository.findById(data.supplier_id);
    if (!supplier || supplier.deleted === 'true') {
      throw new ApiError(`Supplier with ID '${data.supplier_id}' not found`, httpStatus.NOT_FOUND);
    }

    const staffId = context.userId || 'system-staff';
    const staffName = context.userName || 'Billing Staff';
    const tillId = data.till_id || context.tillId || null;
    const purchaseDate = data.purchase_date ? new Date(data.purchase_date) : new Date();

    const invoiceNumber = this.generateInvoiceNumber();
    const batchNumber = data.batch_number ? data.batch_number.trim().toUpperCase() : this.generateBatchNumber();

    // 2. Validate all products and calculate line items
    let grossTotal = 0;
    let calculatedTaxTotal = 0;
    let totalQuantity = 0;

    interface PreparedItem {
      product: any;
      itemQty: number;
      subtotal: number;
      taxRate: number;
      taxAmount: number;
      discount: number;
      totalAmount: number;
      serialsPurchased: string[];
      serialIndexes: string[];
      unit: string;
      costPrice: number;
      sellingPrice: number;
      mrp: number;
    }

    const preparedItems: PreparedItem[] = [];

    for (const item of data.items) {
      const product = await this.productRepository.findById(item.product_id);
      if (!product || product.deleted === 'true') {
        throw new ApiError(`Product with ID '${item.product_id}' not found`, httpStatus.NOT_FOUND);
      }

      const itemQty = item.quantity;
      const subtotal = itemQty * item.cost_price;
      const taxRate = item.tax_rate || 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const discount = item.discount || 0;
      const totalAmount = subtotal + taxAmount - discount;

      grossTotal += subtotal;
      calculatedTaxTotal += taxAmount;
      totalQuantity += itemQty;

      // Serial numbers tracking
      let serialsPurchased: string[] = [];
      let serialIndexes: string[] = [];

      if (item.serial_numbers && item.serial_numbers.length > 0) {
        serialsPurchased = item.serial_numbers.map((s) => s.trim());
      } else {
        serialsPurchased = Array.from({ length: itemQty }, (_, i) => `${product.barcode}-${batchNumber}-${i + 1}`);
      }

      if (item.serial_number_indexes && item.serial_number_indexes.length > 0) {
        serialIndexes = item.serial_number_indexes.map((idx) => String(idx));
      } else {
        serialIndexes = Array.from({ length: itemQty }, (_, i) => String(i + 1));
      }

      preparedItems.push({
        product,
        itemQty,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        totalAmount,
        serialsPurchased,
        serialIndexes,
        unit: item.unit || product.unit || 'pcs',
        costPrice: item.cost_price,
        sellingPrice: item.selling_price,
        mrp: item.mrp || item.selling_price,
      });
    }

    const discountAmount = data.discount || 0;
    const finalTaxAmount = data.tax_amount !== undefined ? data.tax_amount : calculatedTaxTotal;
    const netAmount = Math.max(0, grossTotal - discountAmount + finalTaxAmount);
    const totalPaid = Math.min(netAmount, data.total_paid || 0);
    const balanceAmount = Math.max(0, netAmount - totalPaid);
    const paymentMethod = data.payment_method || 'CASH';

    let paymentStatus: PaymentStatus = 'UNPAID';
    if (totalPaid >= netAmount && netAmount > 0) {
      paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      paymentStatus = 'PARTIAL';
    }

    // 3. Till Balance Verification & Cash Deduction
    // If paying by CASH (or till is specified with paid amount > 0)
    let tillRecord: any = null;
    if (totalPaid > 0 && paymentMethod === 'CASH') {
      if (!tillId) {
        throw new ApiError(
          'A valid till_id must be provided to complete cash purchase payment',
          httpStatus.BAD_REQUEST,
        );
      }

      tillRecord = await this.tillRepository.findById(tillId);
      if (!tillRecord) {
        throw new ApiError(`Till with ID '${tillId}' not found`, httpStatus.NOT_FOUND);
      }

      if (tillRecord.is_blocked) {
        throw new ApiError(`Till '${tillRecord.name}' is currently blocked`, httpStatus.BAD_REQUEST);
      }

      if (tillRecord.status !== 'open') {
        throw new ApiError(
          `Till '${tillRecord.name}' is closed. Till must be open to perform cash transactions`,
          httpStatus.BAD_REQUEST,
        );
      }

      if (tillRecord.cash_in_till < totalPaid) {
        throw new ApiError(
          `Insufficient cash in till '${tillRecord.name}'. Available: ₹${tillRecord.cash_in_till.toFixed(
            2,
          )}, Required: ₹${totalPaid.toFixed(2)}`,
          httpStatus.BAD_REQUEST,
        );
      }

      // Deduct total_paid from till cash balance
      const newCashInTill = tillRecord.cash_in_till - totalPaid;
      await this.tillRepository.update(tillId, { cash_in_till: newCashInTill });
    }

    // 4. Create PurchaseInvoice
    const invoiceData: Partial<IPurchaseInvoice> = {
      invoice_number: invoiceNumber,
      supplier_invoice_number: data.supplier_invoice_number || '',
      supplier_id: supplier.id || supplier._id,
      supplier_name: supplier.name,
      staff_id: staffId,
      staff_name: staffName,
      till_id: tillId,
      batch_id: null,
      batch_number: batchNumber,
      total_amount: grossTotal,
      discount: discountAmount,
      tax_amount: finalTaxAmount,
      net_amount: netAmount,
      total_paid: totalPaid,
      balance_amount: balanceAmount,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      items_count: preparedItems.length,
      total_quantity: totalQuantity,
      purchase_date: purchaseDate,
      notes: data.notes || '',
      deleted: 'false',
      textile_id: textileId,
      tenant_id: context.tenantId || textileId,
    };

    const invoice = await this.purchaseRepository.createInvoice(invoiceData);
    const invoiceId = (invoice.id || invoice._id).toString();

    // 5. Create ProductBatches (Flat inventory lots per product)
    const batchPayloads: Partial<IProductBatch>[] = preparedItems.map((item) => ({
      batch_number: batchNumber,
      product_id: item.product.id || item.product._id,
      product_name: item.product.name,
      barcode: item.product.barcode,
      description: item.product.description || '',
      unit: item.unit,
      quantity: item.itemQty,
      quantity_sold: 0,
      quantity_returned: 0,
      quantity_available: item.itemQty,
      cost_price: item.costPrice,
      selling_price: item.sellingPrice,
      mrp: item.mrp,
      serial_number_indexes: item.serialIndexes,
      serial_numbers_purchased: item.serialsPurchased,
      serial_numbers_sold: [],
      serial_numbers_available: item.serialsPurchased,
      supplier_id: supplier.id || supplier._id,
      supplier_name: supplier.name,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      till_id: tillId,
      staff_id: staffId,
      staff_name: staffName,
      received_date: purchaseDate,
      status: 'ACTIVE',
      notes: data.notes || '',
      deleted: 'false',
      textile_id: textileId,
      tenant_id: context.tenantId || textileId,
    }));

    const createdBatches = await this.purchaseRepository.createBatches(batchPayloads);
    const firstBatchId = createdBatches.length > 0 ? (createdBatches[0].id || createdBatches[0]._id).toString() : null;

    // Update invoice with primary batch_id reference
    if (firstBatchId) {
      await this.purchaseRepository.updateInvoice(invoiceId, { batch_id: firstBatchId });
      invoice.batch_id = firstBatchId;
    }

    // Map each batch to product for purchase line item linking
    const batchMapByProduct = new Map<string, IProductBatch>();
    createdBatches.forEach((b) => batchMapByProduct.set(b.product_id, b));

    // 6. Complete line item purchase records and save
    const purchasePayloads: Partial<IPurchase>[] = preparedItems.map((item) => {
      const pid = (item.product.id || item.product._id).toString();
      const linkedBatch = batchMapByProduct.get(pid);
      const bId = linkedBatch ? (linkedBatch.id || linkedBatch._id).toString() : (firstBatchId || '');

      return {
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        batch_id: bId,
        batch_number: batchNumber,
        supplier_id: supplier.id || supplier._id,
        supplier_name: supplier.name,
        staff_id: staffId,
        staff_name: staffName,
        till_id: tillId,
        product_id: pid,
        product_name: item.product.name,
        barcode: item.product.barcode,
        quantity: item.itemQty,
        unit: item.unit,
        cost_price: item.costPrice,
        selling_price: item.sellingPrice,
        mrp: item.mrp,
        tax_rate: item.taxRate,
        tax_amount: item.taxAmount,
        discount: item.discount,
        subtotal: item.subtotal,
        total_amount: item.totalAmount,
        total_paid: totalPaid > 0 && netAmount > 0 ? (item.totalAmount / netAmount) * totalPaid : 0,
        serial_number_indexes: item.serialIndexes,
        serial_numbers_purchased: item.serialsPurchased,
        notes: data.notes || '',
        deleted: 'false',
        textile_id: textileId,
        tenant_id: context.tenantId || textileId,
      };
    });

    const purchases = await this.purchaseRepository.createPurchases(purchasePayloads);

    return {
      invoice,
      batches: createdBatches,
      purchases,
    };
  }

  // ================= Invoices =================
  async getInvoices(filter: Record<string, any> = {}, context?: PurchaseContext): Promise<IPurchaseInvoice[]> {
    const query: Record<string, any> = { deleted: 'false', ...filter };
    const textileId = await this.resolveTextileId(context?.textileId);
    if (textileId && !query.textile_id) {
      query.textile_id = textileId;
    }
    return this.purchaseRepository.findInvoices(query);
  }

  async getInvoiceById(idOrNumber: string): Promise<PurchaseInvoiceDetailsResult> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrNumber);
    let invoice: IPurchaseInvoice | null = null;

    if (isObjectId) {
      invoice = await this.purchaseRepository.findInvoiceById(idOrNumber);
    }
    if (!invoice) {
      invoice = await this.purchaseRepository.findInvoiceByNumber(idOrNumber);
    }

    if (!invoice || invoice.deleted === 'true') {
      throw new ApiError(`Purchase invoice '${idOrNumber}' not found`, httpStatus.NOT_FOUND);
    }

    const actualInvoiceId = (invoice.id || invoice._id).toString();
    const purchases = await this.purchaseRepository.findPurchasesByInvoiceId(actualInvoiceId);
    const batches = await this.purchaseRepository.findBatchesByInvoiceId(actualInvoiceId);

    // Populate supplier, till, and products
    const supplier = invoice.supplier_id ? await this.supplierRepository.findById(invoice.supplier_id) : null;
    const till = invoice.till_id ? await this.tillRepository.findById(invoice.till_id) : null;

    const productIds = [...new Set([...purchases.map((p) => p.product_id), ...batches.map((b) => b.product_id)].filter(Boolean))];
    const ProductModel = (await import('@/module/product/infrastructure/product.schema.js')).default;
    const products = await ProductModel.find({ _id: { $in: productIds } } as any).lean();
    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));

    const enrichedPurchases = purchases.map((p) => ({
      ...p,
      product: productMap.get(p.product_id?.toString()) || null,
    }));

    const enrichedBatches = batches.map((b) => ({
      ...b,
      product: productMap.get(b.product_id?.toString()) || null,
    }));

    return {
      invoice: {
        ...invoice,
        supplier,
        till,
      },
      batches: enrichedBatches,
      items: enrichedPurchases,
    };
  }

  async updateInvoice(id: string, data: UpdatePurchaseInvoiceDto): Promise<IPurchaseInvoice> {
    const invoice = await this.purchaseRepository.findInvoiceById(id);
    if (!invoice || invoice.deleted === 'true') {
      throw new ApiError(`Purchase invoice with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    const updatePayload: Partial<IPurchaseInvoice> = {};
    if (data.supplier_invoice_number !== undefined) updatePayload.supplier_invoice_number = data.supplier_invoice_number;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.payment_method !== undefined) updatePayload.payment_method = data.payment_method;
    if (data.till_id !== undefined) updatePayload.till_id = data.till_id;

    if (data.total_paid !== undefined) {
      const newTotalPaid = Math.min(invoice.net_amount, data.total_paid);
      const additionalPaid = newTotalPaid - invoice.total_paid;

      // If additional cash is being paid through a till, verify till balance
      const method = data.payment_method || invoice.payment_method;
      const targetTillId = data.till_id || invoice.till_id;

      if (additionalPaid > 0 && method === 'CASH') {
        if (!targetTillId) {
          throw new ApiError('till_id is required to record additional cash payment', httpStatus.BAD_REQUEST);
        }
        const till = await this.tillRepository.findById(targetTillId);
        if (!till) throw new ApiError(`Till with ID '${targetTillId}' not found`, httpStatus.NOT_FOUND);
        if (till.is_blocked) throw new ApiError(`Till '${till.name}' is blocked`, httpStatus.BAD_REQUEST);
        if (till.status !== 'open') throw new ApiError(`Till '${till.name}' is not open`, httpStatus.BAD_REQUEST);
        if (till.cash_in_till < additionalPaid) {
          throw new ApiError(
            `Insufficient cash in till '${till.name}'. Available: ₹${till.cash_in_till.toFixed(2)}, Required: ₹${additionalPaid.toFixed(2)}`,
            httpStatus.BAD_REQUEST,
          );
        }
        await this.tillRepository.update(targetTillId, { cash_in_till: till.cash_in_till - additionalPaid });
      }

      updatePayload.total_paid = newTotalPaid;
      updatePayload.balance_amount = Math.max(0, invoice.net_amount - newTotalPaid);

      if (newTotalPaid >= invoice.net_amount && invoice.net_amount > 0) {
        updatePayload.payment_status = 'PAID';
      } else if (newTotalPaid > 0) {
        updatePayload.payment_status = 'PARTIAL';
      } else {
        updatePayload.payment_status = 'UNPAID';
      }
    }

    const updated = await this.purchaseRepository.updateInvoice(id, updatePayload);
    if (!updated) {
      throw new ApiError('Failed to update purchase invoice', httpStatus.INTERNAL_SERVER_ERROR);
    }
    return updated;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const invoice = await this.purchaseRepository.findInvoiceById(id);
    if (!invoice || invoice.deleted === 'true') {
      throw new ApiError(`Purchase invoice with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    // Soft delete invoice
    await this.purchaseRepository.deleteInvoice(id);

    // Cancel related batches
    const batches = await this.purchaseRepository.findBatchesByInvoiceId(id);
    for (const batch of batches) {
      if (batch.id || batch._id) {
        await this.purchaseRepository.updateBatch(batch.id || batch._id, {
          status: 'CANCELLED',
          deleted: 'true',
        });
      }
    }

    return true;
  }

  // ================= Batches (Inventory Lots) =================
  async getBatches(
    filter: Record<string, any> = {},
    options: { page?: number; limit?: number; sort?: Record<string, any> } = {},
    context?: PurchaseContext,
  ): Promise<{
    batches: IProductBatch[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: Record<string, any> = { deleted: 'false', ...filter };
    const textileId = await this.resolveTextileId(context?.textileId);
    if (textileId && !query.textile_id) {
      query.textile_id = textileId;
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const total = await this.purchaseRepository.countBatches(query);
    const batches = await this.purchaseRepository.findBatches(query, {
      skip,
      limit,
      sort: options.sort || { received_date: -1, createdAt: -1 },
    });

    return {
      batches,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getBatchById(id: string): Promise<IProductBatch> {
    const batch = await this.purchaseRepository.findBatchById(id);
    if (!batch || batch.deleted === 'true') {
      throw new ApiError(`Product batch with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }
    return batch;
  }

  async getBatchesByProductId(productId: string, context?: PurchaseContext): Promise<IProductBatch[]> {
    const textileId = await this.resolveTextileId(context?.textileId);
    return this.purchaseRepository.findBatchesByProductId(productId, textileId);
  }

  // ================= Purchase Reports (Detailed List) =================
  async getPurchaseReport(
    filter: Record<string, any> = {},
    options: { page?: number; limit?: number; sort?: Record<string, any> } = {},
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
  }> {
    const query: Record<string, any> = { deleted: 'false', ...filter };
    const textileId = await this.resolveTextileId(context?.textileId);
    if (textileId && !query.textile_id) {
      query.textile_id = textileId;
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const total = await this.purchaseRepository.countPurchaseReport(query);
    const purchases = await this.purchaseRepository.getPurchaseReport(query, {
      skip,
      limit,
      sort: options.sort || { purchase_date: -1, createdAt: -1 },
    });

    // Calculate overall summary metrics
    const PurchaseInvoiceModel = (await import('@/module/purchase/infrastructure/purchase-invoice.schema.js')).default;
    const summaryAgg = await PurchaseInvoiceModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total_purchases_count: { $sum: 1 },
          total_amount: { $sum: '$total_amount' },
          total_tax: { $sum: '$tax_amount' },
          total_discount: { $sum: '$discount' },
          net_amount: { $sum: '$net_amount' },
          total_paid: { $sum: '$total_paid' },
          balance_amount: { $sum: '$balance_amount' },
          total_quantity: { $sum: '$total_quantity' },
        },
      },
    ]);

    const summary = summaryAgg.length > 0
      ? {
          total_purchases_count: summaryAgg[0].total_purchases_count || 0,
          total_amount: summaryAgg[0].total_amount || 0,
          total_tax: summaryAgg[0].total_tax || 0,
          total_discount: summaryAgg[0].total_discount || 0,
          net_amount: summaryAgg[0].net_amount || 0,
          total_paid: summaryAgg[0].total_paid || 0,
          balance_amount: summaryAgg[0].balance_amount || 0,
          total_quantity: summaryAgg[0].total_quantity || 0,
        }
      : {
          total_purchases_count: 0,
          total_amount: 0,
          total_tax: 0,
          total_discount: 0,
          net_amount: 0,
          total_paid: 0,
          balance_amount: 0,
          total_quantity: 0,
        };

    return {
      purchases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      summary,
    };
  }

  // ================= Purchases (Line Items) =================
  async getPurchases(filter: Record<string, any> = {}, context?: PurchaseContext): Promise<IPurchase[]> {
    const query: Record<string, any> = { deleted: 'false', ...filter };
    const textileId = await this.resolveTextileId(context?.textileId);
    if (textileId && !query.textile_id) {
      query.textile_id = textileId;
    }
    return this.purchaseRepository.findPurchases(query);
  }

  async getPurchaseById(id: string): Promise<IPurchase> {
    const purchase = await this.purchaseRepository.findPurchaseById(id);
    if (!purchase || purchase.deleted === 'true') {
      throw new ApiError(`Purchase record with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }
    return purchase;
  }
}
