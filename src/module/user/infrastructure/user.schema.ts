import { Schema, model, Document } from 'mongoose';

export interface IUserDocument extends Document {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  role: string;
  user_type: string;
  tenant_id?: string | null;
  textile_id?: string | null;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      default: 'CASHIER',
    },
    user_type: {
      type: String,
      default: 'CASHIER',
    },
    tenant_id: {
      type: String,
      default: null,
    },
    textile_id: {
      type: String,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
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

export const UserModel = model<IUserDocument>('User', UserSchema);
export default UserModel;
