import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as companyService from '../services/company.service'; // Use index export
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
// import path from 'path'; // No longer needed here

// Create a company for the currently logged-in user
export const createMyCompany = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    const logoPath = req.file?.path; // Get path from multer

    // Pass text body and separate logo path to service
    const company = await companyService.createCompany(
      req.user.id,
      req.body,
      logoPath,
    );
    res.status(httpStatus.CREATED).send(company);
  },
);

// Get the company associated with the currently logged-in user
export const getMyCompany = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  const company = await companyService.getCompanyByUserId(req.user.id);
  res.send(company);
});

// Update the company associated with the currently logged-in user
export const updateMyCompany = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    const logoPath = req.file?.path; // Get path from multer
    // Consider how to handle logo deletion if needed (e.g., a specific flag in req.body)

    // Pass text body and separate logo path (or undefined) to service
    const updatedCompany = await companyService.updateCompanyByUserId(
      req.user.id,
      req.body,
      logoPath,
    );
    res.send(updatedCompany);
  },
);

// TODO: Add controllers for admin access if needed
