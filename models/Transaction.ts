import mongoose, { Schema, models, model, Document } from "mongoose";

/**
 * ממשק TypeScript עבור מודל תנועה פיננסית (הוצאה/הכנסה)
 */
export interface ITransaction extends Document {
  amount: number;
  category: string;
  date: Date;
  description: string;
  type: "expense" | "income";
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * מודל (סכמה) עבור תנועה פיננסית - הוצאה או הכנסה
 * משויכת למשתמש מסוים לפי userId
 */
const TransactionSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["expense", "income"],
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Transaction = models.Transaction || model<ITransaction>("Transaction", TransactionSchema);
export default Transaction;
