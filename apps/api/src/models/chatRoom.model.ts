import { Schema, model, Document, Types } from 'mongoose';

export interface ChatRoomDocument extends Document {
  organizationId: Types.ObjectId;
  name: string;
  isGroup: boolean;
  description?: string;
  avatar?: string;
  members: {
    userId: Types.ObjectId;
    name: string;
    email: string;
    role: string;
    joinedAt: Date;
  }[];
  lastMessage?: {
    text: string;
    senderId?: Types.ObjectId;
    senderName?: string;
    sentAt?: Date;
  };
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const chatRoomSchema = new Schema<ChatRoomDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isGroup: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '💬',
    },
    members: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        name: { type: String, required: true },
        email: { type: String, required: true },
        role: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    lastMessage: {
      text: { type: String, default: '' },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      senderName: { type: String, default: '' },
      sentAt: { type: Date, default: Date.now },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ChatRoomModel = model<ChatRoomDocument>('ChatRoom', chatRoomSchema);
