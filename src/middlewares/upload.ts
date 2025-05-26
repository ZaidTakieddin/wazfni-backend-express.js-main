import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

// Define base upload directory relative to project root
const baseUploadDir = path.resolve(__dirname, '../../uploads');

// Enhanced function to ensure directory exists with better error handling
const ensureDirExists = (dirPath: string) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Failed to create directory ${dirPath}:`, error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to create upload directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

// Utility function to safely delete a file
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
      return true;
    }
    return false; // File didn't exist
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    return false;
  }
};

// Utility function to delete file by relative path
export const deleteFileByRelativePath = (relativePath: string): boolean => {
  const absolutePath = path.resolve(__dirname, '../..', relativePath);
  return deleteFile(absolutePath);
};

// Configuration for Logos (Images)
const logoDir = path.join(baseUploadDir, 'logos');
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureDirExists(logoDir);
      cb(null, logoDir);
    } catch (error) {
      cb(error instanceof Error ? error : new Error('Unknown error'), logoDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + extension); // Prefix filename
  },
});

// Configuration for Avatars (Images)
const avatarDir = path.join(baseUploadDir, 'avatars');
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureDirExists(avatarDir);
      cb(null, avatarDir);
    } catch (error) {
      cb(
        error instanceof Error ? error : new Error('Unknown error'),
        avatarDir,
      );
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + extension); // Prefix filename
  },
});

// Configuration for CVs (PDF, DOC, DOCX)
const cvDir = path.join(baseUploadDir, 'cvs');
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureDirExists(cvDir);
      cb(null, cvDir);
    } catch (error) {
      cb(error instanceof Error ? error : new Error('Unknown error'), cvDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, 'cv-' + uniqueSuffix + extension); // Prefix filename
  },
});

// File filter for Images
const imageFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(httpStatus.BAD_REQUEST, 'Only image files are allowed!'));
  }
};

// File filter for CVs
const cvFileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        httpStatus.BAD_REQUEST,
        'Only PDF, DOC, or DOCX files are allowed for CVs!',
      ),
    );
  }
};

// --- Multer Instances ---

const uploadLogoInstance = multer({
  storage: logoStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
});

const uploadAvatarInstance = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 1024 * 1024 * 2 }, // 2MB limit for avatars
});

const uploadCvInstance = multer({
  storage: cvStorage,
  fileFilter: cvFileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit for CVs
});

// --- Exported Middleware ---

/** Middleware for single logo upload (expects field named 'logo') */
export const uploadLogo = uploadLogoInstance.single('logo');

/** Middleware for single avatar upload (expects field named 'avatar') */
export const uploadAvatar = uploadAvatarInstance.single('avatar');

/** Middleware for single CV upload (expects field named 'cv') */
export const uploadCv = uploadCvInstance.single('cv');

/** Middleware for handling both avatar and CV potentially (used for profile update) */
export const uploadProfileFiles = multer({
  storage: multer.diskStorage({
    // Need dynamic destination/filename
    destination: (req, file, cb) => {
      try {
        let destDir;
        if (file.fieldname === 'avatar') {
          destDir = avatarDir;
        } else if (file.fieldname === 'cv') {
          destDir = cvDir;
        } else {
          // If unexpected field, maybe use a default or throw error
          return cb(new Error('Unexpected field name'), baseUploadDir);
        }
        ensureDirExists(destDir);
        cb(null, destDir);
      } catch (error) {
        cb(
          error instanceof Error ? error : new Error('Unknown error'),
          baseUploadDir,
        );
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'avatar') {
      imageFileFilter(req, file, cb);
    } else if (file.fieldname === 'cv') {
      cvFileFilter(req, file, cb);
    } else {
      cb(null, false); // Reject unexpected fields
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 10, // Use largest limit (CV's 10MB)
  },
}).fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cv', maxCount: 1 },
]);

// Helper function to get relative path
export const getRelativePath = (absolutePath: string): string => {
  return path
    .relative(path.resolve(__dirname, '../..'), absolutePath)
    .replace(/\\/g, '/'); // Ensure forward slashes for consistency
};

// Initialize base upload directory on module load
try {
  ensureDirExists(baseUploadDir);
} catch (error) {
  console.error('Failed to initialize base upload directory:', error);
}
