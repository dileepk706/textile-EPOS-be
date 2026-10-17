import { Schema, model, Document } from 'mongoose';
import { ISalesInvoice } from '@/module/sales/domain/interfaces/sales-invoice.entity.interface.js';

export interface ISalesInvoiceDocument extends Document, Omit<ISalesInvoice, 'id' | '_id'> {
  createdAt: Date;
  updatedAt: Date;
}

export const SalesInvoiceSchema = new Schema<ISalesInvoiceDocument>(
  {
    invoice_number: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    till_id: {
      type: String,
      required: [true, 'Till ID is required'],
      index: true,
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
      default: 'PAID',
      index: true,
    },
    payment_method: {
      type: String,
      enum: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CREDIT', 'SPLIT'],
      default: 'CASH',
      index: true,
    },
    items_count: {
      type: Number,
      default: 0,
    },
    total_quantity: {
      type: Number,
      default: 0,
    },
    sale_date: {
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

export const SalesInvoiceModel = model<ISalesInvoiceDocument>('SalesInvoice', SalesInvoiceSchema);
export default SalesInvoiceModel;
