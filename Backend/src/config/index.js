// Load environment variables
const env = process.env;

export const config = {
  // Server configuration
  port: parseInt(env.PORT || '3001', 10),
  nodeEnv: env.NODE_ENV || 'development',
  
  // CORS configuration
  cors: {
    origin: env.CORS_ORIGIN || 'http://localhost:5173',
    methods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    headers: 'Content-Type, Authorization, X-Requested-With',
  },
  
  // JWT configuration (for future auth)
  jwt: {
    secret: env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    expiresIn: env.JWT_EXPIRES_IN || '7d',
  },
  
  // Database configuration (placeholder)
  database: {
    url: env.DATABASE_URL || 'sqlite://./data.db',
  },
};

export default config;

