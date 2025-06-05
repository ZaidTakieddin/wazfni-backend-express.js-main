import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { User, Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/prisma';
import ApiError from '../utils/ApiError';
import { generateToken } from '../utils/jwt';
import config from '../config/config';

// Initialize Google OAuth2 client
const googleClient = new OAuth2Client(config.google.clientId);

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
  userData: Pick<User, 'email' | 'firstName' | 'lastName' | 'phoneNumber'> & {
    password: string;
  },
): Promise<Omit<User, 'passwordHash'>> => {
  const { email, password, firstName, lastName, phoneNumber } = userData;

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
      firstName: firstName || null,
      lastName: lastName || null,
      phoneNumber: phoneNumber || null,
    },
  });

  await prisma.userProfile.create({
    data: {
      userId: user.id,
      firstName: firstName || null,
      lastName: lastName || null,
      phone: phoneNumber || null,
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

/**
 * Changes a user's password.
 * @param userId - The ID of the user changing their password.
 * @param currentPassword - The user's current password.
 * @param newPassword - The new password to set.
 * @returns A success message.
 * @throws {ApiError} if the current password is incorrect or user is not found.
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> => {
  // Find the user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.passwordHash) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Verify current password
  const isCurrentPasswordMatch = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );

  if (!isCurrentPasswordMatch) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Current password is incorrect',
    );
  }

  // Hash the new password
  const hashedNewPassword = await hashPassword(newPassword);

  // Update the password in the database
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedNewPassword },
  });

  return { message: 'Password changed successfully' };
};

/**
 * Authenticates a user using Google ID token (for React Native).
 * @param idToken - The Google ID token from the client.
 * @returns An object containing the user object (excluding passwordHash) and JWT token.
 * @throws {ApiError} if the token is invalid or verification fails.
 */
export const googleAuth = async (
  idToken: string,
): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> => {
  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Google token');
    }

    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
    } = payload;

    if (!email || !googleId) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        'Google token missing required information',
      );
    }

    // Check if user exists by Google ID
    let user = await prisma.user.findUnique({
      where: { googleId },
    });

    if (user) {
      // Update lastLogin timestamp asynchronously
      prisma.user
        .update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })
        .catch((err) => {
          console.error(
            `Failed to update lastLogin for user ${user?.id}:`,
            err,
          );
        });

      const token = generateToken(user.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    }

    // Check if user exists by email
    user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Link Google ID to existing account
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          googleId,
          isVerified: true,
          firstName: user!.firstName || firstName || null,
          lastName: user!.lastName || lastName || null,
          lastLogin: new Date(),
        },
      });

      const token = generateToken(updatedUser.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userWithoutPassword } = updatedUser;
      return { user: userWithoutPassword, token };
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        googleId,
        firstName: firstName || null,
        lastName: lastName || null,
        isVerified: true,
        lastLogin: new Date(),
      },
    });

    // Create user profile
    await prisma.userProfile.create({
      data: {
        userId: newUser.id,
        firstName: firstName || null,
        lastName: lastName || null,
      },
    });

    const token = generateToken(newUser.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword, token };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Google authentication error:', error);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Google authentication failed');
  }
};
