// ═══════════════════════════════════════════════════════════
// QA Forge — Socket.IO Server Setup
// Real-time pipeline progress updates
// ═══════════════════════════════════════════════════════════

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../config/logger';

let io: Server | null = null;

/**
 * Initialize Socket.IO server with auth
 */
export function initSocketIO(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN.split(','),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as { id: string };
      (socket as any).userId = payload.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    logger.debug({ userId, socketId: socket.id }, 'WebSocket client connected');

    // Join session room for pipeline updates
    socket.on('session:join', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      logger.debug({ userId, sessionId }, 'Joined session room');
    });

    socket.on('session:leave', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      logger.debug({ userId, socketId: socket.id }, 'WebSocket client disconnected');
    });
  });

  logger.info('✅ Socket.IO initialized');
  return io;
}

/**
 * Emit pipeline progress to all clients in a session room
 */
export function emitPipelineProgress(sessionId: string, data: Record<string, unknown>): void {
  io?.to(`session:${sessionId}`).emit('pipeline:progress', data);
}

/**
 * Emit agent status change
 */
export function emitAgentStatus(sessionId: string, data: Record<string, unknown>): void {
  io?.to(`session:${sessionId}`).emit('pipeline:agent:status', data);
}

export function getIO(): Server | null {
  return io;
}
