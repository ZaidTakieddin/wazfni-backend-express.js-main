// src/config/config.ts
import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file from the root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define a schema for environment variables using Zod for validation and type safety
const envVarsSchema = z.object({
  NODE_ENV: z
    .enum(['production', 'development', 'test'])
    .default('development'),
  //   PORT: z.coerce.number().default(5000),
  //   DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // JWT Configuration
  //   JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_ACCESS_EXPIRATION_MINUTES: z.coerce.number().default(30),
  // Optional: Add JWT_REFRESH_EXPIRATION_DAYS if using refresh tokens
  // JWT_REFRESH_EXPIRATION_DAYS: z.coerce.number().default(30),

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  //   GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  //   GOOGLE_CALLBACK_URL: z
  //     .string()
  //     .url('GOOGLE_CALLBACK_URL must be a valid URL'),

  // Add other required environment variables here
  // e.g., EMAIL_HOST, EMAIL_PORT, etc.
});

// Validate process.env against the schema
let envVars;
try {
  envVars = envVarsSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(
      '❌ Invalid environment variables:',
      error.flatten().fieldErrors,
    );
    throw new Error('Invalid environment variables');
  }
  throw error; // Re-throw other errors
}

// Export a structured config object
const config = {
  env: envVars.NODE_ENV,
  //   port: envVars.PORT,
  jwt: {
    //     secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    // Add refresh token expiration if needed
    // refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  },
  google: {
    clientId: envVars.GOOGLE_CLIENT_ID,
    //     clientSecret: envVars.GOOGLE_CLIENT_SECRET,
    //     callbackUrl: envVars.GOOGLE_CALLBACK_URL,
  },
  database: {
    // url: envVars.DATABASE_URL // Already directly used by Prisma often
  },
  //   Add other config sections as needed
};

export default config;
