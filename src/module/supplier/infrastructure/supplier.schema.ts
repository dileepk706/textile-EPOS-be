import { Schema, model, Document } from 'mongoose';
import { ISupplier } from '@/module/supplier/domain/interfaces/supplier.entity.interface.js';

export interface ISupplierDocument extends Document, Omit<ISupplier, 'id' | '_id'> {
  createdAt: Date;
  updatedAt: Date;
}

export const SupplierSchema = new Schema<ISupplierDocument>(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      index: true,
    },
    contact_person: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    gstin: {
      type: String,
      trim: true,
      default: '',
    },
    deleted: {
      type: String,
      default: 'false',
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
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

export const SupplierModel = model<ISupplierDocument>('Supplier', SupplierSchema);
export default SupplierModel;
