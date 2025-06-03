import { Request, Response } from 'express';
import httpStatus from 'http-status';
import moment from 'moment';
import { User } from '@prisma/client';
import * as authService from '../services/auth.service';
import { generateToken } from '../utils/jwt';
import config from '../config/config';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.registerUser(req.body);
  // In a real app, you might want to automatically log the user in here
  // by generating a token and sending it back, similar to the login response.
  res.status(httpStatus.CREATED).send({ user });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { user, token } = await authService.loginUser(req.body);
  res.send({ user, token });
});

export const googleCallback = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as User;

    if (!user) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Google authentication failed',
      );
    }

    // Generate token and calculate expiration directly
    const accessToken = generateToken(user.id);
    const accessTokenExpires = moment()
      .add(config.jwt.accessExpirationMinutes, 'minutes')
      .toDate();

    const tokens = {
      access: {
        token: accessToken,
        expires: accessTokenExpires,
      },
    };

    // Send tokens back to the client
    res.send({ user, tokens });
  },
);

export const logout = catchAsync(async (req: Request, res: Response) => {
  // Assuming stateless JWT, server-side logout might just be a confirmation.
  // If using refresh tokens stored in DB, you'd call a service function here:
  // const refreshToken = req.body.refreshToken; // Assuming client sends refresh token
  // await authService.logoutUser(refreshToken);
  await authService.logoutUser(); // Call placeholder
  res.status(httpStatus.OK).send({ message: 'Logout successful' });
});

export const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword,
    );
    res.status(httpStatus.OK).send(result);
  },
);

// TODO: Add refreshTokens, forgotPassword, resetPassword controllers
