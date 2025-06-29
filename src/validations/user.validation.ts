import { Gender, Role } from '@prisma/client'; // Import generated enums
import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(1, 'First name cannot be empty').optional(),
      lastName: z.string().min(1, 'Last name cannot be empty').optional(),
      jobTitle: z.string().optional(),
      educationCertificate: z.string().optional(),
      experienceYears: z.number().int().min(0).optional(),
      cv: z.string().optional(), // CV path/ID might be handled separately (e.g., file upload endpoint)
      phone: z.string().optional(), // Add specific phone validation if needed
      city: z.string().optional(),
      address: z.string().optional(),
      birthDate: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .optional(), // Validate as ISO string, convert later
      gender: z.nativeEnum(Gender).optional(),
    })
    .partial(), // .partial() makes all fields optional for updates
});

export const getUserSchema = z.object({
  params: z.object({
    userId: z.string().cuid('Invalid User ID'),
  }),
});

// ===== ADMIN USER MANAGEMENT VALIDATION SCHEMAS =====

export const getAllUsersSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1).max(100))
      .optional(),
    sortBy: z
      .enum([
        'createdAt',
        'updatedAt',
        'email',
        'role',
        'isVerified',
        'lastLogin',
      ])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    role: z.nativeEnum(Role).optional(),
    isVerified: z
      .string()
      .transform((val) => val === 'true')
      .pipe(z.boolean())
      .optional(),
    search: z.string().min(1).optional(),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .optional(),
    role: z.nativeEnum(Role).optional(),
    firstName: z.string().min(1, 'First name cannot be empty').optional(),
    lastName: z.string().min(1, 'Last name cannot be empty').optional(),
    phoneNumber: z.string().optional(),
    isVerified: z.boolean().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    userId: z.string().cuid('Invalid User ID'),
  }),
  body: z
    .object({
      email: z.string().email('Invalid email format').optional(),
      password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .optional(),
      role: z.nativeEnum(Role).optional(),
      firstName: z.string().min(1, 'First name cannot be empty').optional(),
      lastName: z.string().min(1, 'Last name cannot be empty').optional(),
      phoneNumber: z.string().optional(),
      isVerified: z.boolean().optional(),
    })
    .partial(),
});

export const deleteUserSchema = z.object({
  params: z.object({
    userId: z.string().cuid('Invalid User ID'),
  }),
});

export const getUserDetailSchema = z.object({
  params: z.object({
    userId: z.string().cuid('Invalid User ID'),
  }),
});
