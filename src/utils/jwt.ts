import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';
import ApiError from './ApiError';
import httpStatus from 'http-status';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_for_dev'; // Use env var

/**
 * Generates a JWT token with unlimited expiration.
 * @param userId - The ID of the user.
 * @returns The generated JWT token.
 */
export const generateToken = (userId: string): string => {
  if (!JWT_SECRET) {
    // In a real app, you might throw or log a critical error
    console.error('JWT_SECRET is not defined!');
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'JWT secret is missing',
    );
  }

  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000), // Issued at timestamp
  };

  // Explicitly type the secret and options
  const secret: Secret = JWT_SECRET;
  const options: SignOptions = {
    // No expiresIn option - token will never expire
  };

  return jwt.sign(payload, secret, options);
};

/**
 * Verifies a JWT token.
 * @param token - The JWT token to verify.
 * @returns The decoded payload if the token is valid.
 * @throws {ApiError} if the token is invalid or expired.
 */
export const verifyToken = (token: string): jwt.JwtPayload => {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined!');
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'JWT secret is missing',
    );
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === 'string') {
      // Should not happen with standard JWTs but handle defensively
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token payload type');
    }

    // Revert type assertion
    return payload as jwt.JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Token expired');
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
  }
};
