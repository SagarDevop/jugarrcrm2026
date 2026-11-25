import { logger } from './logger';

export const startKeepAlive = (serverUrl?: string, intervalMinutes = 12) => {
  // Render automatically injects RENDER_EXTERNAL_URL in all web services
  const targetUrl =
    serverUrl ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SERVER_URL ||
    process.env.PING_URL;

  if (!targetUrl) {
    logger.info('[KeepAlive] No external URL configured. Running in local development mode.');
    return;
  }

  const pingEndpoint = targetUrl.endsWith('/')
    ? `${targetUrl}api/health`
    : `${targetUrl}/api/health`;

  logger.info(
    `[KeepAlive] 24/7 Keep-Alive active! Auto-pinging ${pingEndpoint} every ${intervalMinutes} minutes to prevent Render free-tier sleep.`
  );

  const ping = async () => {
    try {
      const res = await fetch(pingEndpoint);
      if (res.ok) {
        logger.info(
          `[KeepAlive] Ping successful (${res.status} OK). Render server kept active 24/7. (${new Date().toLocaleTimeString()})`
        );
      } else {
        logger.warn(`[KeepAlive] Ping responded with status: ${res.status}`);
      }
    } catch (err: any) {
      logger.warn(`[KeepAlive] Ping attempt warning: ${err.message}`);
    }
  };

  // Initial warmup ping after 30 seconds
  setTimeout(ping, 30 * 1000);

  // Periodic recurring ping every 12 minutes (Render idle sleep timeout is 15 minutes)
  const intervalMs = intervalMinutes * 60 * 1000;
  const timer = setInterval(ping, intervalMs);
  timer.unref();
};
