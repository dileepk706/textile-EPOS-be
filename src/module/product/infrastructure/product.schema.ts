import { Schema, model, Document } from 'mongoose';
import { IProduct } from '@/module/product/domain/interfaces/product.entity.interface.js';

export interface IProductDocument extends Document, Omit<IProduct, 'id' | '_id'> {
  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      trim: true,
      index: true,
    },
    deleted: {
      type: String,
      default: 'false',
      index: true,
    },
    unit: {
      type: String,
      trim: true,
      default: 'pcs',
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      default: '',
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
    is_active: {
      type: Boolean,
      default: true,
    },
    quantity_available: {
      type: Number,
      default: 0,
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

export const ProductModel = model<IProductDocument>('Product', ProductSchema);
export default ProductModel;
