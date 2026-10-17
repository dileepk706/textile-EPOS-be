import { Schema, model, Document } from 'mongoose';
import { ICategory } from '@/module/category/domain/interfaces/category.entity.interface.js';

export interface ICategoryDocument extends Document, Omit<ICategory, 'id' | '_id'> {
  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
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
    deleted: {
      type: String,
      default: 'false',
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

export const CategoryModel = model<ICategoryDocument>('Category', CategorySchema);
export default CategoryModel;
