import { Schema, model, Document } from 'mongoose';
import { ISaleItem } from '@/module/sales/domain/interfaces/sale-item.entity.interface.js';

export interface ISaleItemDocument extends Document, Omit<ISaleItem, 'id' | '_id'> {
  createdAt: Date;
  updatedAt: Date;
}

export const SaleItemSchema = new Schema<ISaleItemDocument>(
  {
    invoice_id: {
      type: String,
      required: [true, 'Invoice ID is required'],
      index: true,
    },
    invoice_number: {
      type: String,
      required: [true, 'Invoice number is required'],
      index: true,
    },
    batch_id: {
      type: String,
      required: [true, 'Batch ID is required'],
      index: true,
    },
    batch_number: {
      type: String,
      required: [true, 'Batch number is required'],
      index: true,
    },
    product_id: {
      type: String,
      required: [true, 'Product ID is required'],
      index: true,
    },
    product_name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      default: 'pcs',
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0,
    },
    cost_price: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      default: 0,
    },
    tax_rate: {
      type: Number,
      default: 0,
    },
    tax_amount: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    total_paid: {
      type: Number,
      default: 0,
    },
    serial_numbers_sold: {
      type: [String],
      default: [],
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

export const SaleItemModel = model<ISaleItemDocument>('SaleItem', SaleItemSchema);
export default SaleItemModel;
