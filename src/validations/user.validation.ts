import { Gender } from '@prisma/client'; // Import generated Gender enum
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
