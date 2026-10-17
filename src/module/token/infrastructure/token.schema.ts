import { Schema, model, Document } from 'mongoose';

export interface IRefreshTokenDocument extends Document {
  token_hash: string;
  user_id: string;
  ip?: string;
  user_agent?: string;
  expires_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    token_hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: '',
    },
    user_agent: {
      type: String,
      default: '',
    },
    expires_at: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: MongoDB auto-removes document when expires_at is reached
    },
  },
  {
    timestamps: true,
  },
);

export const RefreshTokenModel = model<IRefreshTokenDocument>('RefreshToken', RefreshTokenSchema);
export default RefreshTokenModel;
