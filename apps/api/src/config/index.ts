import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root or apps/api
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agencyos',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'agencyos_super_secret_access_jwt_key_2026_production_grade',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'agencyos_super_secret_refresh_jwt_key_2026_production_grade',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
  },
  videoGen: {
    enabled: process.env.ENABLE_VIDEO_GENERATION === 'true',
    provider: process.env.VIDEO_API_PROVIDER || 'mock',
  },
};
