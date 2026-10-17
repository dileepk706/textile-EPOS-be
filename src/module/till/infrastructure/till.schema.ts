import { Schema, model, Document } from 'mongoose';
import { ITill } from '@/module/till/domain/interfaces/till.entity.interface.js';

export interface ITillDocument extends Document, Omit<ITill, 'id' | '_id'> {
  createdAt: Date;
  updatedAt: Date;
}

export const TillSchema = new Schema<ITillDocument>(
  {
    name: {
      type: String,
      required: [true, 'Till name is required'],
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Till code is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password or PIN is required'],
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'blocked'],
      default: 'closed',
      index: true,
    },
    is_blocked: {
      type: Boolean,
      default: false,
    },
    cash_in_till: {
      type: Number,
      default: 0,
    },
    opening_balance: {
      type: Number,
      default: 0,
    },
    closing_balance: {
      type: Number,
      default: null,
    },
    discrepancy: {
      type: Number,
      default: null,
    },
    textile_id: {
      type: String,
      default: null,
      index: true,
    },
    tenant_id: {
      type: String,
      default: null,
      index: true,
    },
    is_linked: {
      type: Boolean,
      default: false,
    },
    device_info: {
      type: String,
      default: null,
    },
    assigned_user_id: {
      type: String,
      default: null,
    },
    last_opened_at: {
      type: Date,
      default: null,
    },
    last_closed_at: {
      type: Date,
      default: null,
    },
    last_opened_by: {
      type: String,
      default: null,
    },
    last_closed_by: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: '',
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
        delete ret.password;
        return ret;
      },
    },
  },
);

export const TillModel = model<ITillDocument>('Till', TillSchema);
export default TillModel;
