import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async function to catch errors and pass them to the next middleware.
 * @param fn - The async function to wrap.
 * @returns A standard Express route handler.
 */
const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

export default catchAsync;
