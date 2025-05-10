import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { User, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { generateToken } from '../utils/jwt';

/**
 * Hashes a password using bcrypt.
 * @param password - The plain text password.
 * @returns The hashed password.
 */
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10; // Or use an environment variable
  return bcrypt.hash(password, saltRounds);
};

/**
 * Creates a new user.
 * @param userData - User data (email, password, name).
 * @returns The created user object (excluding passwordHash).
 * @throws {ApiError} if email is already taken.
 */
export const registerUser = async (
  userData: Pick<User, 'email' | 'name'> & { password: string },
): Promise<Omit<User, 'passwordHash'>> => {
  const { email, password, name } = userData;

  // Check if email is already taken (handled by DB constraint, but good practice)
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'Email already taken');
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name: name || null,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Logs in a user and updates lastLogin.
 * @param credentials - User login credentials (email, password).
 * @returns An object containing the user object (excluding passwordHash) and JWT token.
 * @throws {ApiError} if email or password is incorrect.
 */
export const loginUser = async (
  credentials: Pick<User, 'email'> & { password: string },
): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> => {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  // Update lastLogin timestamp asynchronously (fire and forget)
  prisma.user
    .update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })
    .catch((err) => {
      // Log error if updating lastLogin fails, but don't block login
      console.error(`Failed to update lastLogin for user ${user.id}:`, err);
    });

  const token = generateToken(user.id);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...userWithoutPassword } = user;

  // Return the user data as it was *before* the lastLogin update,
  // or refetch if you need the absolute latest state including lastLogin.
  return { user: userWithoutPassword, token };
};

// Placeholder for logout logic (e.g., invalidating refresh tokens)
export const logoutUser =
  async (/* Add necessary parameters like refreshToken if stateful */): Promise<void> => {
    // If using stateless JWT, there might be nothing to do on the server.
    // If storing refresh tokens in DB, find and delete/invalidate the token here.
    // Example (if using refresh tokens):
    // const refreshTokenDoc = await tokenService.findToken(refreshToken);
    // if (!refreshTokenDoc) {
    //   throw new ApiError(httpStatus.NOT_FOUND, 'Refresh token not found');
    // }
    // await tokenService.deleteToken(refreshTokenDoc.id);
    console.log(
      'Logout requested. Server-side action depends on token strategy.',
    );
    return;
  };
