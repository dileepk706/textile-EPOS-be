import { Schema, model, Document } from 'mongoose';
import {
  ITextile,
  ITextileAddress,
  ITextileSettings,
} from '@/module/textile/domain/interfaces/textile.entity.interface.js';

export interface ITextileDocument extends Document, Omit<ITextile, 'id' | '_id'> {
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<ITextileAddress>(
  {
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    postal_code: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
  },
  { _id: false },
);

const SettingsSchema = new Schema<ITextileSettings>(
  {
    receipt_header: { type: String, default: '' },
    receipt_footer: { type: String, default: 'Thank you for shopping with us!' },
    tax_rate: { type: Number, default: 5 },
    enable_barcode: { type: Boolean, default: true },
  },
  { _id: false },
);

export const TextileSchema = new Schema<ITextileDocument>(
  {
    name: {
      type: String,
      required: [true, 'Textile business name is required'],
      trim: true,
      index: true,
    },
    code: {
      type: String,
      trim: true,
      default: 'TXT-MAIN',
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: AddressSchema,
      default: () => ({}),
    },
    gstin: {
      type: String,
      trim: true,
      default: '',
    },
    currency: {
      type: String,
      trim: true,
      default: 'INR',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    tenant_id: {
      type: String,
      default: null,
      index: true,
    },
    settings: {
      type: SettingsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const TextileModel = model<ITextileDocument>('Textile', TextileSchema);
export default TextileModel;
