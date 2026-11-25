import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { config } from './config';
import { connectDB } from './config/db';
import { initSocketIO } from './sockets';
import { logger } from './utils/logger';
import { startKeepAlive } from './utils/keepAlive';

const startServer = async () => {
  try {
    // Attempt database connection
    try {
      await connectDB();
    } catch (dbErr) {
      logger.warn('Could not connect to MongoDB Atlas/local server directly. Check MONGODB_URI.');
    }

    const app = createApp();
    const server = http.createServer(app);

    const io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const allowed = [
            config.clientUrl,
            'https://vinsan.jugarr.in',
            'http://vinsan.jugarr.in',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
          ];
          if (
            allowed.includes(origin) ||
            origin.endsWith('.jugarr.in') ||
            origin.endsWith('onrender.com') ||
            origin.endsWith('vercel.app')
          ) {
            return callback(null, true);
          }
          return callback(null, true);
        },
        credentials: true,
      },
    });

    initSocketIO(io);

    server.listen(config.port, () => {
      logger.info(`[AgencyOS API] Server listening on http://localhost:${config.port}`);
      // Start 24/7 keep-alive self-ping on Render (sleep happens after 15m of inactivity)
      startKeepAlive();
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
