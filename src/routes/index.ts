import express, { Router } from 'express';
import authRoutes from './auth.route';
import userRoutes from './user.route'; // Import user routes
import companyRoutes from './company.route'; // Import company routes
import jobRoutes from './job.route'; // Import job routes
import categoryRoutes from './category.route'; // Import category routes
import workExperienceRoute from './workExperience.route';
import educationCertificateRoute from './educationCertificate.route';
import applicationRoute from './application.route'; // Import the new route
import bookmarkRoute from './bookmark.route';
import categoryClickRoutes from './categoryClick.routes';
import jobViewHistoryRoutes from './jobViewHistory.routes';
import approvalRoutes from './approval.route'; // Import approval routes
import fcmRoutes from './fcm.route'; // Import FCM routes
// Import other route modules here as they are created

const router = express.Router();

interface RouteConfig {
  path: string;
  route: Router;
}

const defaultRoutes: RouteConfig[] = [
  {
    path: '/auth',
    route: authRoutes,
  },
  // Add other routes here:
  {
    path: '/users', // Mount user routes under /users
    route: userRoutes,
  },
  {
    path: '/company', // Mount company routes under /company (relative to /api/v1)
    route: companyRoutes,
  },
  {
    path: '/jobs', // Mount job routes under /jobs
    route: jobRoutes,
  },
  {
    path: '/categories', // Mount category routes
    route: categoryRoutes,
  },
  {
    path: '/profile/work-experience',
    route: workExperienceRoute,
  },
  {
    path: '/profile/education-certificates',
    route: educationCertificateRoute,
  },
  {
    path: '/applications',
    route: applicationRoute,
  },
  {
    path: '/bookmarks',
    route: bookmarkRoute,
  },
  {
    path: '/category-clicks',
    route: categoryClickRoutes,
  },
  {
    path: '/job-views',
    route: jobViewHistoryRoutes,
  },
  {
    path: '/admin/approval', // Mount approval routes under /admin/approval
    route: approvalRoutes,
  },
  {
    path: '/fcm', // Mount FCM routes under /fcm
    route: fcmRoutes,
  },
];

// Register all routes
defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
