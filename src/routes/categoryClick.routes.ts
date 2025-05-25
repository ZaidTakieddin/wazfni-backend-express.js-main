import { Router } from 'express';
import {
  recordCategoryClick,
  getUserCategoryClicks,
} from '../controllers/categoryClick.controller';
import auth from '@/middlewares/auth';

const router = Router();

// Record a category click
router.post('/:categoryId', auth, recordCategoryClick);

// Get user's category clicks
router.get('/my-clicks', auth, getUserCategoryClicks);

export default router;
