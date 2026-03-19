import mongoose, { Schema, models, model } from "mongoose";

/**
 * מודל (סכמה) עבור הוצאה נפרדת המשויכת למשתמש
 */
const ExpenseSchema = new Schema(
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
      required: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // ההוצאה חייבת להיות משוייכת למשתמש מסוים
    },
  },
  { timestamps: true }
);

const Expense = models.Expense || model("Expense", ExpenseSchema);
export default Expense;
