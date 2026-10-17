import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import { ApiError } from '@/shared/middleware/error_handler.js';
import ISalesRepository from '@/module/sales/domain/interfaces/sales.repository.interface.js';
import ISalesService, {
  SalesContext,
  SaleSummaryResult,
  SaleInvoiceDetailsResult,
} from '@/module/sales/domain/interfaces/sales.service.interface.js';
import { ISalesInvoice, SalesPaymentStatus } from '@/module/sales/domain/interfaces/sales-invoice.entity.interface.js';
import { ISaleItem } from '@/module/sales/domain/interfaces/sale-item.entity.interface.js';
import { CreateSaleDto } from '@/module/sales/application/dtos/create-sale.dto.js';
import IPurchaseRepository from '@/module/purchase/domain/interfaces/purchase.repository.interface.js';
import ITillRepository from '@/module/till/domain/interfaces/till.repository.interface.js';
import IProductRepository from '@/module/product/domain/interfaces/product.repository.interface.js';
import TextileModel from '@/module/textile/infrastructure/textile.schema.js';

@injectable()
export default class SalesService implements ISalesService {
  constructor(
    @inject('ISalesRepository') private readonly salesRepository: ISalesRepository,
    @inject('IPurchaseRepository') private readonly purchaseRepository: IPurchaseRepository,
    @inject('ITillRepository') private readonly tillRepository: ITillRepository,
    @inject('IProductRepository') private readonly productRepository: IProductRepository,
  ) {}

  private async resolveTextileId(contextTextileId?: string): Promise<string | null> {
    if (contextTextileId) return contextTextileId;
    const defaultTextile = await TextileModel.findOne({ is_active: true });
    return defaultTextile ? defaultTextile._id.toString() : null;
  }

  private generateInvoiceNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    return `SINV-${dateStr}-${random}`;
  }

  async createSale(data: CreateSaleDto, context: SalesContext): Promise<SaleSummaryResult> {
    const textileId = await this.resolveTextileId(context.textileId);

    const tillId = data.till_id || context.tillId;
    if (!tillId) {
      throw new ApiError('Till ID is required to process point-of-sale billing', httpStatus.BAD_REQUEST);
    }

    // 1. Verify Till Status
    const till = await this.tillRepository.findById(tillId);
    if (!till) {
      throw new ApiError(`Till with ID '${tillId}' not found`, httpStatus.NOT_FOUND);
    }
    if (till.is_blocked) {
      throw new ApiError(`Till '${till.name}' is currently blocked`, httpStatus.BAD_REQUEST);
    }
    if (till.status !== 'open') {
      throw new ApiError(`Till '${till.name}' is closed. Till must be opened before billing`, httpStatus.BAD_REQUEST);
    }

    const staffId = context.userId || 'system-staff';
    const staffName = context.userName || 'Cashier Staff';
    const invoiceNumber = this.generateInvoiceNumber();

    // 2. Validate Batches & Stock Availability
    interface PreparedSaleItem {
      batch: any;
      product: any;
      quantity: number;
      unitPrice: number;
      costPrice: number;
      taxRate: number;
      taxAmount: number;
      discount: number;
      subtotal: number;
      totalAmount: number;
      serialsSold: string[];
    }

    const preparedItems: PreparedSaleItem[] = [];
    let grossTotal = 0;
    let calculatedTaxTotal = 0;
    let totalQuantity = 0;

    for (const item of data.items) {
      // Find batch
      const batch = await this.purchaseRepository.findBatchById(item.batch_id);
      if (!batch || batch.deleted === 'true') {
        throw new ApiError(`Product batch with ID '${item.batch_id}' not found`, httpStatus.NOT_FOUND);
      }
      if (batch.status !== 'ACTIVE') {
        throw new ApiError(
          `Product batch '${batch.batch_number}' is not active (status: ${batch.status})`,
          httpStatus.BAD_REQUEST,
        );
      }
      if (batch.product_id !== item.product_id) {
        throw new ApiError(
          `Batch '${batch.batch_number}' does not match product '${item.product_id}'`,
          httpStatus.BAD_REQUEST,
        );
      }

      // Check quantity availability
      if (batch.quantity_available < item.quantity) {
        throw new ApiError(
          `Insufficient stock in batch '${batch.batch_number}' for product '${batch.product_name}'. Requested: ${item.quantity}, Available: ${batch.quantity_available}`,
          httpStatus.BAD_REQUEST,
        );
      }

      // Validate serial numbers if provided or required
      let serialsSold: string[] = [];
      if (item.serial_numbers && item.serial_numbers.length > 0) {
        if (item.serial_numbers.length !== item.quantity) {
          throw new ApiError(
            `Serial numbers count (${item.serial_numbers.length}) does not match quantity (${item.quantity}) for product '${batch.product_name}'`,
            httpStatus.BAD_REQUEST,
          );
        }

        // Ensure all provided serials exist in serial_numbers_available
        const availableSerialsSet = new Set(batch.serial_numbers_available || []);
        for (const sn of item.serial_numbers) {
          if (!availableSerialsSet.has(sn)) {
            throw new ApiError(
              `Serial number '${sn}' is not available in batch '${batch.batch_number}'`,
              httpStatus.BAD_REQUEST,
            );
          }
        }
        serialsSold = item.serial_numbers;
      } else if (batch.serial_numbers_available && batch.serial_numbers_available.length >= item.quantity) {
        // Automatically deduct first N available serial numbers FIFO
        serialsSold = batch.serial_numbers_available.slice(0, item.quantity);
      }

      // Line item pricing
      const subtotal = item.quantity * item.unit_price;
      const taxRate = item.tax_rate || 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const discount = item.discount || 0;
      const totalAmount = subtotal + taxAmount - discount;

      grossTotal += subtotal;
      calculatedTaxTotal += taxAmount;
      totalQuantity += item.quantity;

      preparedItems.push({
        batch,
        product: { id: batch.product_id, name: batch.product_name, barcode: batch.barcode, unit: batch.unit },
        quantity: item.quantity,
        unitPrice: item.unit_price,
        costPrice: batch.cost_price,
        taxRate,
        taxAmount,
        discount,
        subtotal,
        totalAmount,
        serialsSold,
      });
    }

    const discountAmount = data.discount || 0;
    const finalTaxAmount = data.tax_amount !== undefined ? data.tax_amount : calculatedTaxTotal;
    const netAmount = Math.max(0, grossTotal - discountAmount + finalTaxAmount);
    // If total_paid not specified, assume paid in full
    const totalPaid = data.total_paid !== undefined ? data.total_paid : netAmount;
    const balanceAmount = Math.max(0, netAmount - totalPaid);
    const paymentMethod = data.payment_method || 'CASH';

    let paymentStatus: SalesPaymentStatus = 'UNPAID';
    if (totalPaid >= netAmount && netAmount > 0) {
      paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      paymentStatus = 'PARTIAL';
    } else if (netAmount === 0) {
      paymentStatus = 'PAID';
    }

    // 3. Create SalesInvoice
    const invoiceData: Partial<ISalesInvoice> = {
      invoice_number: invoiceNumber,
      till_id: tillId,
      staff_id: staffId,
      staff_name: staffName,
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
      sale_date: new Date(),
      notes: data.notes || '',
      deleted: 'false',
      textile_id: textileId,
      tenant_id: context.tenantId || textileId,
    };

    const invoice = await this.salesRepository.createInvoice(invoiceData);
    const invoiceId = (invoice.id || invoice._id).toString();

    // 4. Create Sale Line Items
    const lineItemPayloads: Partial<ISaleItem>[] = preparedItems.map((item) => ({
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      batch_id: (item.batch.id || item.batch._id).toString(),
      batch_number: item.batch.batch_number,
      product_id: item.product.id,
      product_name: item.product.name,
      barcode: item.product.barcode,
      till_id: tillId,
      staff_id: staffId,
      staff_name: staffName,
      quantity: item.quantity,
      unit: item.product.unit || 'pcs',
      unit_price: item.unitPrice,
      cost_price: item.costPrice,
      mrp: item.batch.mrp || item.unitPrice,
      tax_rate: item.taxRate,
      tax_amount: item.taxAmount,
      discount: item.discount,
      subtotal: item.subtotal,
      total_amount: item.totalAmount,
      total_paid: netAmount > 0 ? (item.totalAmount / netAmount) * totalPaid : 0,
      serial_numbers_sold: item.serialsSold,
      notes: data.notes || '',
      deleted: 'false',
      textile_id: textileId,
      tenant_id: context.tenantId || textileId,
    }));

    const createdItems = await this.salesRepository.createSaleItems(lineItemPayloads);

    // 5. Decrement Batch Inventory & Serial Numbers
    for (const item of preparedItems) {
      const b = item.batch;
      const newSoldQty = b.quantity_sold + item.quantity;
      const newAvailableQty = b.quantity - newSoldQty;
      const updatedStatus = newAvailableQty <= 0 ? 'DEPLETED' : 'ACTIVE';

      // Update serial numbers
      const soldSet = new Set(item.serialsSold);
      const remainingSerialsAvailable = (b.serial_numbers_available || []).filter((sn: string) => !soldSet.has(sn));
      const updatedSerialsSold = [...(b.serial_numbers_sold || []), ...item.serialsSold];

      await this.purchaseRepository.updateBatch(b.id || b._id, {
        quantity_sold: newSoldQty,
        quantity_available: Math.max(0, newAvailableQty),
        status: updatedStatus,
        serial_numbers_available: remainingSerialsAvailable,
        serial_numbers_sold: updatedSerialsSold,
      });
    }

    // 6. Adjust (Increment) Till Balance when cash is collected
    // If payment_method is CASH, increment till cash balance by total_paid
    if (paymentMethod === 'CASH' && totalPaid > 0) {
      const newCashInTill = till.cash_in_till + totalPaid;
      await this.tillRepository.update(tillId, { cash_in_till: newCashInTill });
    }

    return {
      invoice,
      items: createdItems,
    };
  }

  // ================= Invoices =================
  async getInvoices(
    filter: Record<string, any> = {},
    options: { page?: number; limit?: number; sort?: Record<string, any> } = {},
    context?: SalesContext,
  ): Promise<{
    invoices: ISalesInvoice[];
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

    const total = await this.salesRepository.countInvoices(query);
    const invoices = await this.salesRepository.findInvoices(query, {
      skip,
      limit,
      sort: options.sort || { sale_date: -1, createdAt: -1 },
    });

    return {
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getInvoiceById(idOrNumber: string): Promise<SaleInvoiceDetailsResult> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrNumber);
    let invoice: ISalesInvoice | null = null;

    if (isObjectId) {
      invoice = await this.salesRepository.findInvoiceById(idOrNumber);
    }
    if (!invoice) {
      invoice = await this.salesRepository.findInvoiceByNumber(idOrNumber);
    }

    if (!invoice || invoice.deleted === 'true') {
      throw new ApiError(`Sales invoice '${idOrNumber}' not found`, httpStatus.NOT_FOUND);
    }

    const actualInvoiceId = (invoice.id || invoice._id).toString();
    const items = await this.salesRepository.findSaleItemsByInvoiceId(actualInvoiceId);

    // Populate till, products, and batches
    const till = invoice.till_id ? await this.tillRepository.findById(invoice.till_id) : null;

    const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))];
    const batchIds = [...new Set(items.map((i) => i.batch_id).filter(Boolean))];

    const ProductModel = (await import('@/module/product/infrastructure/product.schema.js')).default;
    const ProductBatchModel = (await import('@/module/purchase/infrastructure/product-batch.schema.js')).default;

    const [products, batches] = await Promise.all([
      ProductModel.find({ _id: { $in: productIds } } as any).lean(),
      ProductBatchModel.find({ _id: { $in: batchIds } } as any).lean(),
    ]);

    const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));
    const batchMap = new Map(batches.map((b: any) => [b._id.toString(), b]));

    const enrichedItems = items.map((item) => ({
      ...item,
      product: productMap.get(item.product_id?.toString()) || null,
      batch: batchMap.get(item.batch_id?.toString()) || null,
    }));

    return {
      invoice: {
        ...invoice,
        till,
      },
      items: enrichedItems,
    };
  }

  async cancelInvoice(id: string): Promise<boolean> {
    const invoice = await this.salesRepository.findInvoiceById(id);
    if (!invoice || invoice.deleted === 'true') {
      throw new ApiError(`Sales invoice with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }

    // Soft delete invoice
    await this.salesRepository.deleteInvoice(id);

    // Fetch line items to restore inventory & deduct till balance if paid in cash
    const items = await this.salesRepository.findSaleItemsByInvoiceId(id);
    for (const item of items) {
      const batch = await this.purchaseRepository.findBatchById(item.batch_id);
      if (batch) {
        const restoredAvailable = batch.quantity_available + item.quantity;
        const restoredSold = Math.max(0, batch.quantity_sold - item.quantity);
        const restoredStatus = restoredAvailable > 0 ? 'ACTIVE' : batch.status;

        // Restore serial numbers
        const soldSet = new Set(item.serial_numbers_sold || []);
        const restoredSerialsSold = (batch.serial_numbers_sold || []).filter((sn) => !soldSet.has(sn));
        const restoredSerialsAvailable = [...(batch.serial_numbers_available || []), ...(item.serial_numbers_sold || [])];

        await this.purchaseRepository.updateBatch(batch.id || batch._id, {
          quantity_available: restoredAvailable,
          quantity_sold: restoredSold,
          status: restoredStatus,
          serial_numbers_available: restoredSerialsAvailable,
          serial_numbers_sold: restoredSerialsSold,
        });
      }
    }

    // If invoice was paid in CASH, deduct from till
    if (invoice.payment_method === 'CASH' && invoice.total_paid > 0 && invoice.till_id) {
      const till = await this.tillRepository.findById(invoice.till_id);
      if (till) {
        const adjustedCash = Math.max(0, till.cash_in_till - invoice.total_paid);
        await this.tillRepository.update(invoice.till_id, { cash_in_till: adjustedCash });
      }
    }

    return true;
  }

  // ================= Transactions (Line Items) =================
  async getSaleItems(
    filter: Record<string, any> = {},
    options: { page?: number; limit?: number; sort?: Record<string, any> } = {},
    context?: SalesContext,
  ): Promise<{
    transactions: ISaleItem[];
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

    const total = await this.salesRepository.countSaleItems(query);
    const transactions = await this.salesRepository.findSaleItems(query, {
      skip,
      limit,
      sort: options.sort || { createdAt: -1 },
    });

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getSaleItemById(id: string): Promise<ISaleItem> {
    const item = await this.salesRepository.findSaleItemById(id);
    if (!item || item.deleted === 'true') {
      throw new ApiError(`Sale transaction item with ID '${id}' not found`, httpStatus.NOT_FOUND);
    }
    return item;
  }

  // ================= Sales Reports (Detailed List) =================
  async getSalesReport(
    filter: Record<string, any> = {},
    options: { page?: number; limit?: number; sort?: Record<string, any> } = {},
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
  }> {
    const query: Record<string, any> = { deleted: 'false', ...filter };
    const textileId = await this.resolveTextileId(context?.textileId);
    if (textileId && !query.textile_id) {
      query.textile_id = textileId;
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const total = await this.salesRepository.countSalesReport(query);
    const sales = await this.salesRepository.getSalesReport(query, {
      skip,
      limit,
      sort: options.sort || { sale_date: -1, createdAt: -1 },
    });

    // Calculate overall summary metrics
    const SalesInvoiceModel = (await import('@/module/sales/infrastructure/sales-invoice.schema.js')).default;
    const summaryAgg = await SalesInvoiceModel.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total_sales_count: { $sum: 1 },
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

    const summary =
      summaryAgg.length > 0
        ? {
            total_sales_count: summaryAgg[0].total_sales_count || 0,
            total_amount: summaryAgg[0].total_amount || 0,
            total_tax: summaryAgg[0].total_tax || 0,
            total_discount: summaryAgg[0].total_discount || 0,
            net_amount: summaryAgg[0].net_amount || 0,
            total_paid: summaryAgg[0].total_paid || 0,
            balance_amount: summaryAgg[0].balance_amount || 0,
            total_quantity: summaryAgg[0].total_quantity || 0,
          }
        : {
            total_sales_count: 0,
            total_amount: 0,
            total_tax: 0,
            total_discount: 0,
            net_amount: 0,
            total_paid: 0,
            balance_amount: 0,
            total_quantity: 0,
          };

    return {
      sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      summary,
    };
  }
}
