import { Request, Response, NextFunction } from 'express';
import { ChatRoomModel } from '../../models/chatRoom.model';
import { ChatMessageModel } from '../../models/chatMessage.model';
import { UserModel } from '../../models/user.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { emitOrgEvent } from '../../sockets';
import { USER_ROLES } from '@agencyos/shared';

export class ChatController {
  static async listRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const filter: any = { organizationId: user.organizationId };

      if (user.role !== USER_ROLES.SUPER_ADMIN) {
        filter['members.userId'] = user._id;
      }

      let rooms = await ChatRoomModel.find(filter).sort({ 'lastMessage.sentAt': -1, updatedAt: -1 });

      // If no rooms exist for the org yet, initialize a default #General agency room
      if (rooms.length === 0) {
        const teamUsers = await UserModel.find({ organizationId: user.organizationId });
        const defaultMembers = teamUsers.map((u) => ({
          userId: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          joinedAt: new Date(),
        }));

        const initialRoom = await ChatRoomModel.create({
          organizationId: user.organizationId,
          name: 'General Agency HQ',
          isGroup: true,
          description: 'Official company-wide chat channel for team updates, announcements and deal collaboration.',
          avatar: '🏢',
          members: defaultMembers,
          lastMessage: {
            text: 'Welcome to Jugarr Agency Live Chat! Connect, close deals and collaborate in real time.',
            senderName: 'System',
            sentAt: new Date(),
          },
          createdBy: user._id,
        });

        await ChatMessageModel.create({
          organizationId: user.organizationId,
          roomId: initialRoom._id,
          senderId: user._id,
          senderName: user.name,
          senderRole: user.role,
          message: 'Welcome everyone to the Jugarr CRM Live Team Chat! 🚀',
          sentAt: new Date(),
        });

        rooms = [initialRoom];
      }

      return ApiResponse.success(res, rooms);
    } catch (err) {
      next(err);
    }
  }

  static async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { name, description, avatar, memberUserIds, isGroup = true } = req.body;

      if (!name) {
        throw new AppError('Group name is required.', 400);
      }

      // Collect user info for members
      const uniqueIds = Array.from(new Set([String(user._id), ...(memberUserIds || [])]));
      const users = await UserModel.find({ _id: { $in: uniqueIds }, organizationId: user.organizationId });

      const members = users.map((u) => ({
        userId: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        joinedAt: new Date(),
      }));

      const newRoom = await ChatRoomModel.create({
        organizationId: user.organizationId,
        name,
        isGroup: Boolean(isGroup),
        description: description || '',
        avatar: avatar || '💬',
        members,
        lastMessage: {
          text: `Group created by ${user.name}`,
          senderId: user._id,
          senderName: user.name,
          sentAt: new Date(),
        },
        createdBy: user._id,
      });

      emitOrgEvent(String(user.organizationId), 'chat:room_created', newRoom);

      return ApiResponse.success(res, newRoom, 'Group chat channel created successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  static async listMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { roomId } = req.params;

      const room = await ChatRoomModel.findOne({ _id: roomId, organizationId: user.organizationId });
      if (!room) {
        throw new AppError('Chat channel not found.', 404);
      }

      const messages = await ChatMessageModel.find({
        organizationId: user.organizationId,
        roomId,
      })
        .sort({ sentAt: 1 })
        .limit(150);

      return ApiResponse.success(res, messages);
    } catch (err) {
      next(err);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { roomId } = req.params;
      const { message, attachments } = req.body;

      if (!message || !message.trim()) {
        throw new AppError('Message content cannot be empty.', 400);
      }

      const room = await ChatRoomModel.findOne({ _id: roomId, organizationId: user.organizationId });
      if (!room) {
        throw new AppError('Chat channel not found.', 404);
      }

      const savedMessage = await ChatMessageModel.create({
        organizationId: user.organizationId,
        roomId,
        senderId: user._id,
        senderName: user.name,
        senderRole: user.role,
        message: message.trim(),
        attachments: Array.isArray(attachments) ? attachments : [],
        sentAt: new Date(),
      });

      // Update room lastMessage
      await ChatRoomModel.findByIdAndUpdate(roomId, {
        lastMessage: {
          text: savedMessage.message,
          senderId: user._id,
          senderName: user.name,
          sentAt: savedMessage.sentAt,
        },
      });

      // Broadcast live to all members via Socket.IO
      emitOrgEvent(String(user.organizationId), 'chat:message', {
        roomId,
        message: savedMessage,
      });

      return ApiResponse.success(res, savedMessage, 'Message sent successfully.', 201);
    } catch (err) {
      next(err);
    }
  }
}
