import { Schema, model, Document, Types } from 'mongoose';

export interface ChatMessageDocument extends Document {
  organizationId: Types.ObjectId;
  roomId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  senderRole: string;
  message: string;
  attachments: string[];
  readBy: {
    userId: Types.ObjectId;
    name: string;
    readAt: Date;
  }[];
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<ChatMessageDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    readBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        name: { type: String, required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const ChatMessageModel = model<ChatMessageDocument>('ChatMessage', chatMessageSchema);
