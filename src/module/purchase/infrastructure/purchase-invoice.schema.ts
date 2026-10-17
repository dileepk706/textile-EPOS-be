import { Schema, model, Document } from 'mongoose';
import { IPurchaseInvoice } from '@/module/purchase/domain/interfaces/purchase-invoice.entity.interface.js';

export interface IPurchaseInvoiceDocument extends Document, Omit<IPurchaseInvoice, 'id' | '_id'> {
  createdAt: Date;
  updatedAt: Date;
}

export const PurchaseInvoiceSchema = new Schema<IPurchaseInvoiceDocument>(
  {
    invoice_number: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    supplier_invoice_number: {
      type: String,
      trim: true,
      default: '',
    },
    supplier_id: {
      type: String,
      required: [true, 'Supplier ID is required'],
      index: true,
    },
    supplier_name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    staff_id: {
      type: String,
      required: [true, 'Staff ID is required'],
      index: true,
    },
    staff_name: {
      type: String,
      trim: true,
      default: '',
    },
    till_id: {
      type: String,
      default: null,
      index: true,
    },
    batch_id: {
      type: String,
      default: null,
      index: true,
    },
    batch_number: {
      type: String,
      default: '',
      index: true,
    },
    total_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax_amount: {
      type: Number,
      default: 0,
    },
    net_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    total_paid: {
      type: Number,
      default: 0,
    },
    balance_amount: {
      type: Number,
      default: 0,
    },
    payment_status: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      default: 'UNPAID',
      index: true,
    },
    payment_method: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CREDIT'],
      default: 'CASH',
    },
    items_count: {
      type: Number,
      default: 0,
    },
    total_quantity: {
      type: Number,
      default: 0,
    },
    purchase_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    deleted: {
      type: String,
      default: 'false',
      index: true,
    },
    textile_id: {
      type: String,
      default: null,
      index: true,
    },
    tenant_id: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        const id = ret._id ? ret._id.toString() : undefined;
        ret.id = id;
        ret._id = id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const PurchaseInvoiceModel = model<IPurchaseInvoiceDocument>('PurchaseInvoice', PurchaseInvoiceSchema);
export default PurchaseInvoiceModel;
