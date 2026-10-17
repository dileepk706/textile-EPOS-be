import { Schema, model, Document } from 'mongoose';
import { IProductBatch } from '@/module/purchase/domain/interfaces/product-batch.entity.interface.js';

export interface IProductBatchDocument extends Document, Omit<IProductBatch, 'id' | '_id'> {
  createdAt: Date;
  updatedAt: Date;
}

export const ProductBatchSchema = new Schema<IProductBatchDocument>(
  {
    batch_number: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
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
      index: true,
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    unit: {
      type: String,
      default: 'pcs',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity_sold: {
      type: Number,
      default: 0,
    },
    quantity_returned: {
      type: Number,
      default: 0,
    },
    quantity_available: {
      type: Number,
      required: true,
      min: 0,
    },
    cost_price: {
      type: Number,
      required: true,
      min: 0,
    },
    selling_price: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      default: 0,
    },
    serial_number_indexes: {
      type: [String],
      default: [],
    },
    serial_numbers_purchased: {
      type: [String],
      default: [],
    },
    serial_numbers_sold: {
      type: [String],
      default: [],
    },
    serial_numbers_available: {
      type: [String],
      default: [],
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
    till_id: {
      type: String,
      default: null,
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
    received_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DEPLETED', 'CANCELLED'],
      default: 'ACTIVE',
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

// Compound index for unique batch per product in an invoice or lot
ProductBatchSchema.index({ batch_number: 1, product_id: 1, textile_id: 1 });

export const ProductBatchModel = model<IProductBatchDocument>('ProductBatch', ProductBatchSchema);
export default ProductBatchModel;
