import { z } from 'zod';

// Schema for creating a company - make fields required initially?
// Or allow partial creation and update later?
// Let's start with making name required for creation.
export const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Company name is required'),
    workField: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    size: z.string().optional(),
    website: z.string().url({ message: 'Invalid URL format' }).optional(),
    city: z.string().optional(),
    commercial_register: z.string().optional(),
    tax_number: z.string().optional(),
    logo: z.string().optional(), // Logo path likely handled separately
  }),
});

// Schema for updating a company - all fields optional
export const updateCompanySchema = z.object({
  body: z
    .object({
      name: z.string().min(1).optional(),
      workField: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      size: z.string().optional(),
      website: z.string().url({ message: 'Invalid URL format' }).optional(),
      city: z.string().optional(),
      commercial_register: z.string().optional(),
      tax_number: z.string().optional(),
      // logo: z.string().optional(),
    })
    .partial(), // Ensure all fields are optional for PATCH
});
