import mongoose, { Schema, models, model, Document } from "mongoose";

/**
 * TypeScript interface for Subscription model
 */
export interface ISubscription extends Document {
  name: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: Date;
  category: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Schema for Subscriptions
 */
const SubscriptionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    nextBillingDate: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
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

const Subscription = models.Subscription || model<ISubscription>("Subscription", SubscriptionSchema);
export default Subscription;
