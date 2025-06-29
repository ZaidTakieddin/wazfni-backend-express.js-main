import { z } from 'zod';
import { listPaginationSchema } from './common.validation';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    icon: z.string().url().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    categoryId: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    icon: z.string().url().optional(),
  }),
});

export const deleteCategorySchema = z.object({
  params: z.object({
    categoryId: z.string(),
  }),
});

export const getCategorySchema = z.object({
  params: z.object({
    categoryId: z.string(),
  }),
});

// SubCategory Validations

export const createSubCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'SubCategory name is required'),
  }),
  params: z.object({
    categoryId: z.string().cuid('Invalid Category ID'),
  }),
});

export const updateSubCategorySchema = z.object({
  body: z
    .object({
      name: z.string().min(1, 'SubCategory name is required'),
    })
    .partial(),
  params: z.object({
    subCategoryId: z.string().cuid('Invalid SubCategory ID'),
  }),
});

export const getSubCategorySchema = z.object({
  params: z.object({
    subCategoryId: z.string().cuid('Invalid SubCategory ID'),
  }),
});

export const getSubCategoriesByCategorySchema = z.object({
  params: z.object({
    categoryId: z.string().cuid('Invalid Category ID'),
  }),
});

export const deleteSubCategorySchema = z.object({
  params: z.object({
    subCategoryId: z.string().cuid('Invalid SubCategory ID'),
  }),
});

export const getCategoriesSchema = z.object({
  query: listPaginationSchema,
});

export const getSubCategoriesSchema = z.object({
  params: z.object({
    categoryId: z.string(),
  }),
  query: listPaginationSchema,
});
