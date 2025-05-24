import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

// Define base upload directory relative to project root
const baseUploadDir = path.resolve(__dirname, '../../uploads');

// Function to ensure directory exists
const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configuration for Logos (Images)
const logoDir = path.join(baseUploadDir, 'logos');
ensureDirExists(logoDir);
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      console.log('Logo upload attempt:', {
        directory: logoDir,
        fileInfo: {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
        },
      });

      // Check if directory exists and is writable
      if (!fs.existsSync(logoDir)) {
        console.error('Logo directory does not exist:', logoDir);
        return cb(new Error('Upload directory does not exist'), logoDir);
      }

      try {
        fs.accessSync(logoDir, fs.constants.W_OK);
      } catch (err) {
        console.error('Logo directory is not writable:', logoDir, err);
        return cb(new Error('Upload directory is not writable'), logoDir);
      }

      cb(null, logoDir);
    } catch (error) {
      console.error('Error in logo upload destination:', error);
      cb(error as Error, logoDir);
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      const filename = 'logo-' + uniqueSuffix + extension;
      console.log('Generated filename:', filename);
      cb(null, filename);
    } catch (error) {
      console.error('Error in logo filename generation:', error);
      cb(error as Error, '');
    }
  },
});

// Configuration for Avatars (Images)
const avatarDir = path.join(baseUploadDir, 'avatars');
ensureDirExists(avatarDir);
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + extension); // Prefix filename
  },
});

// Configuration for CVs (PDF, DOC, DOCX)
const cvDir = path.join(baseUploadDir, 'cvs');
ensureDirExists(cvDir);
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cvDir);
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
  try {
    console.log('Checking image file:', {
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    });

    if (!file.mimetype) {
      console.error('No mimetype provided for file');
      return cb(new ApiError(httpStatus.BAD_REQUEST, 'Invalid file format'));
    }

    if (file.mimetype.startsWith('image/')) {
      console.log('Valid image file detected');
      cb(null, true);
    } else {
      console.error('Invalid file type:', file.mimetype);
      cb(new ApiError(httpStatus.BAD_REQUEST, 'Only image files are allowed!'));
    }
  } catch (error) {
    console.error('Error in image file filter:', error);
    cb(error as Error);
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
