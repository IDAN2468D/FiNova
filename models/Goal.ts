import mongoose, { Schema, models, model, Document } from "mongoose";

/**
 * ממשק TypeScript עבור מודל יעד חיסכון
 */
export interface IGoal extends Document {
  title: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline?: Date;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * מודל (סכמה) עבור יעד חיסכון
 * משויך למשתמש מסוים לפי userId
 */
const GoalSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    targetAmount: {
      type: Number,
      required: true,
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    icon: {
      type: String,
      default: "target",
    },
    color: {
      type: String,
      default: "from-violet-500 to-indigo-400",
    },
    deadline: {
      type: Date,
      required: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Goal = models.Goal || model<IGoal>("Goal", GoalSchema);
export default Goal;
