import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { config } from './config';
import { connectDB } from './config/db';
import { initSocketIO } from './sockets';
import { logger } from './utils/logger';

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
        origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true,
      },
    });

    initSocketIO(io);

    server.listen(config.port, () => {
      logger.info(`[AgencyOS API] Server listening on http://localhost:${config.port}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
