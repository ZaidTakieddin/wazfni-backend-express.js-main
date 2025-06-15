import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    icon: z.string().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z
    .object({
      name: z.string().min(1).optional(),
      icon: z.string().optional(),
    })
    .partial(),
  params: z.object({
    categoryId: z.string().cuid('Invalid Category ID'),
  }),
});

export const getCategorySchema = z.object({
  params: z.object({
    categoryId: z.string().cuid('Invalid Category ID'),
  }),
});

export const deleteCategorySchema = z.object({
  params: z.object({
    categoryId: z.string().cuid('Invalid Category ID'),
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
