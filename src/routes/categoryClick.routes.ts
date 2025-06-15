import { Router } from 'express';
import {
  recordCategoryClick,
  getUserCategoryClicks,
} from '../controllers/categoryClick.controller';
import auth from '../middlewares/auth';

const router = Router();

// Record a subcategory click
router.post('/:subCategoryId', auth, recordCategoryClick);

// Get user's category clicks (returns subcategory clicks with parent category info)
router.get('/my-clicks', auth, getUserCategoryClicks);

export default router;
