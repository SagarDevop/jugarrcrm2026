import { Schema, model, Document, Types } from 'mongoose';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '@agencyos/shared';

export interface IExpenseDoc extends Document {
  organizationId: Types.ObjectId;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  paymentMethod: string;
  description?: string;
  receiptAttachment?: string;
  recordedBy: Types.ObjectId;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpenseDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now, index: true },
    paymentMethod: { type: String, required: true },
    description: { type: String },
    receiptAttachment: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvalStatus: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved', index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

expenseSchema.index({ organizationId: 1, date: 1 });
expenseSchema.index({ organizationId: 1, category: 1 });
expenseSchema.index({ organizationId: 1, approvalStatus: 1 });

export const ExpenseModel = model<IExpenseDoc>('Expense', expenseSchema);

