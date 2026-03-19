import mongoose, { Schema, models, model, Document } from "mongoose";

export interface IAsset extends Document {
  name: string;
  type: 'Cash' | 'Investment' | 'Real Estate' | 'Liability/Loan';
  value: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Cash', 'Investment', 'Real Estate', 'Liability/Loan'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Asset) {
  delete mongoose.models.Asset;
}

const Asset = model<IAsset>("Asset", AssetSchema);
export default Asset;
