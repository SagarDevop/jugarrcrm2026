import { Schema, model, Document, Types } from 'mongoose';
import { CALL_OUTCOMES, CallOutcome, INTEREST_LEVELS, InterestLevel } from '@agencyos/shared';

export interface ICallDoc extends Document {
  organizationId: Types.ObjectId;
  clientId?: Types.ObjectId;
  leadId?: Types.ObjectId;
  clientName: string;
  callDate: Date;
  durationMinutes: number;
  outcome: CallOutcome;
  conversationNotes: string;
  interestLevel: InterestLevel;
  nextAction?: string;
  followUpDate?: Date;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICallDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    clientName: { type: String, required: true, trim: true },
    callDate: { type: Date, required: true, default: Date.now, index: true },
    durationMinutes: { type: Number, default: 0 },
    outcome: { type: String, enum: CALL_OUTCOMES, required: true },
    conversationNotes: { type: String, required: true },
    interestLevel: { type: String, enum: INTEREST_LEVELS, default: 'Medium' },
    nextAction: { type: String },
    followUpDate: { type: Date },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

callSchema.index({ organizationId: 1, callDate: 1 });
callSchema.index({ organizationId: 1, recordedBy: 1 });

export const CallModel = model<ICallDoc>('Call', callSchema);

