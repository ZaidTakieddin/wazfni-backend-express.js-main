import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedSchema = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = parsedSchema.body;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Pass the ZodError to the global error handler
        next(error);
      } else {
        // For other unexpected errors during validation
        next(
          new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Internal validation error',
          ),
        );
      }
    }
  };

export default validate;
