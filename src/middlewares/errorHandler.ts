import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import { Prisma } from '@prisma/client'; // Import Prisma types for specific error handling
import httpStatus from 'http-status'; // We'll need to install this
import { ZodError } from 'zod'; // Import ZodError

// Helper to determine if the environment is development
const isDevelopment = process.env.NODE_ENV === 'development';

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error = err;
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';

  // Convert non-ApiError errors or specific error types to ApiError
  if (!(error instanceof ApiError)) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = error.message || 'Something went wrong';

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === 'P2002') {
        statusCode = httpStatus.CONFLICT;
        // Extract field name(s) if possible
        const target = (error.meta?.target as string[])?.join(', ') || 'field';
        message = `Duplicate value for ${target}`;
      }
      // Record not found (e.g., for update or delete)
      else if (error.code === 'P2025') {
        statusCode = httpStatus.NOT_FOUND;
        message = 'Record not found';
      }
      // Add more Prisma error codes as needed
    }
    // Handle Zod validation errors
    else if (error instanceof ZodError) {
      statusCode = httpStatus.BAD_REQUEST;
      // Format Zod errors
      message =
        error.issues
          .map((issue) => `${issue.path.join('.')} ${issue.message}`)
          .join(', ') || 'Validation Error';
    }
    // Add other specific error type checks here (e.g., JWT errors)

    error = new ApiError(statusCode, message, false, error.stack);
  }

  // Set status code and message from ApiError
  statusCode = (error as ApiError).statusCode;
  message = error.message;

  res.locals.errorMessage = error.message;

  const response = {
    code: statusCode,
    message,
    ...(isDevelopment && { stack: error.stack }), // Include stack trace only in development
  };

  if (isDevelopment) {
    console.error('[ERROR]', err); // Log the original error in development
  }

  res.status(statusCode).send(response);
};

export default errorHandler;
