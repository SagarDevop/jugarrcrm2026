import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

let ioInstance: SocketIOServer | null = null;

export const initSocketIO = (io: SocketIOServer) => {
  ioInstance = io;

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded: any = jwt.verify(token, config.jwt.accessSecret);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, organizationId, role } = socket.data.user || {};
    logger.info(`[Socket.IO] Client connected: ${socket.id} (User: ${userId}, Org: ${organizationId})`);

    if (organizationId) {
      socket.join(`org:${organizationId}`);
    }
    if (userId) {
      socket.join(`user:${userId}`);
    }

    // Real-Time Chat Typing Indicator
    socket.on('chat:typing', (data: { roomId: string; userName?: string; isTyping: boolean }) => {
      if (organizationId && data?.roomId) {
        socket.to(`org:${organizationId}`).emit('chat:user_typing', {
          roomId: data.roomId,
          userId,
          userName: data.userName || 'Team member',
          isTyping: Boolean(data.isTyping),
        });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

export const getIO = (): SocketIOServer | null => ioInstance;

export const emitOrgEvent = (orgId: string, eventName: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(`org:${orgId}`).emit(eventName, data);
  }
};

export const emitUserEvent = (userId: string, eventName: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(eventName, data);
  }
};
