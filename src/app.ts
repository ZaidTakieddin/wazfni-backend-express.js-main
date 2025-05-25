import compression from 'compression';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import path from 'path'; // Import path
// import xss from 'xss-clean'; // Note: xss-clean might be outdated or have issues, consider alternatives like DOMPurify if needed for direct HTML handling
import auth from './middlewares/auth'; // Import the auth middleware
import errorHandler from './middlewares/errorHandler';
import routes from './routes'; // Import the main router

// TODO: Import routes
// TODO: Import error handling middleware

const app: Express = express();

// Initialize Passport
// app.use(passport.initialize());
// No passport.session() needed if using stateless JWT strategy

// Set security HTTP headers
app.use(helmet());

// Enable CORS - adjust origins as needed for production
app.use(cors());
app.options('/{*any}', cors()); // Enable pre-flight requests for all routes - Temporarily commented out

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory - PROTECTED
// 1. Apply auth middleware to check for valid token
// 2. If authenticated, serve the static file
app.use('/uploads', auth, express.static(path.join(__dirname, '../uploads')));

// Sanitize request data (Consider alternatives)
// app.use(xss());

// Gzip compression
app.use(compression());

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   statusCode: 429, // Correct property name for status code
//   message: 'Too many requests from this IP, please try again after 15 minutes',
// });
// app.use('/api', limiter); // Apply rate limiting to all API routes

// Basic health check route
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Server is healthy!');
});

// TODO: Add API routes here (e.g., app.use('/api/v1', routes);)
// Mount API routes
app.use('/api/v1', routes);

// TODO: Add global error handler middleware here
// Global error handler - should be the last middleware
app.use(errorHandler);

export default app;
