import { Application, UserProfile, User } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../config/prisma';
import { getRelativePath } from '../middlewares/upload';
import ApiError from '../utils/ApiError';
import { getUserProfile } from './user.service'; // To get profile CV path

/**
 * Create a job application.
 * @param applicantId
 * @param jobId
 * @param answers
 * @param uploadedCvPath - Path if a new CV was uploaded for this application
 * @returns {Promise<Application>}
 * @throws {ApiError}
 */
export const createApplication = async (
  applicantId: string,
  jobId: string,
  answers: string[],
  uploadedCvPath?: string, // Absolute path from multer
): Promise<Application> => {
  // 1. Check if Job exists and get questions
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { questions: true, companyId: true }, // Select questions and companyId
  });
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }

  // 2. Verify answer count matches question count
  if (job.questions.length !== answers.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Number of answers (${answers.length}) does not match number of questions (${job.questions.length})`,
    );
  }

  // 3. Check if user already applied
  const existingApplication = await prisma.application.findUnique({
    where: { jobId_applicantId: { jobId, applicantId } },
  });
  if (existingApplication) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'You have already applied for this job',
    );
  }

  // 4. Determine CV path (uploaded or profile)
  let cvPathToStore: string | undefined;
  if (uploadedCvPath) {
    cvPathToStore = getRelativePath(uploadedCvPath);
  } else {
    // If no CV uploaded, try getting from profile
    try {
      const userProfile = await getUserProfile(applicantId);
      if (userProfile?.cv) {
        cvPathToStore = userProfile.cv; // Use existing relative path
      }
    } catch (error) {
      // Handle cases where profile might not exist yet, though unlikely if user is logged in
      console.error(`Error fetching profile for user ${applicantId}:`, error);
    }
  }

  // 5. Require CV (either uploaded or from profile)
  if (!cvPathToStore) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'CV is required. Please upload one or add it to your profile.',
    );
  }

  // 6. Create Application
  const application = await prisma.application.create({
    data: {
      job: { connect: { id: jobId } },
      applicant: { connect: { id: applicantId } },
      answers: answers,
      cvPath: cvPathToStore, // Store the relative path
      // status defaults to PENDING
    },
  });

  return application;
};

/**
 * Get applications for a specific job owned by the user's company.
 * @param companyUserId - The user ID of the company representative
 * @param jobId
 * @returns {Promise<Application[]>}
 * @throws {ApiError}
 */
export const getApplicationsForJob = async (
  companyUserId: string,
  jobId: string,
): Promise<Application[]> => {
  // 1. Get the company associated with the user
  const company = await prisma.company.findUnique({
    where: { userId: companyUserId },
    select: { id: true },
  });
  if (!company) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'User is not associated with a company',
    );
  }

  // 2. Get the job and verify it belongs to this company
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { companyId: true },
  });
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }
  if (job.companyId !== company.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Job does not belong to your company',
    );
  }

  // 3. Fetch applications including applicant details
  const applications = await prisma.application.findMany({
    where: { jobId: jobId },
    include: {
      applicant: {
        include: {
          profile: {
            include: {
              educationCertificates: true,
              workExperiences: true,
            },
          },
        },
      },
    },
    orderBy: {
      appliedAt: 'desc',
    },
  });

  return applications;
};

/**
 * Get a specific application by ID, including applicant profile.
 * Ensures the job belongs to the requesting user's company.
 * @param companyUserId - The user ID of the company representative making the request.
 * @param applicationId
 * @returns {Promise<Application & { applicant: (Omit<User, 'passwordHash'> & { profile: UserProfile | null }) } | null>}
 * @throws {ApiError} If application not found or user lacks permission.
 */
export const getApplicationById = async (
  companyUserId: string,
  applicationId: string,
): Promise<
  Application & {
    applicant: Omit<User, 'passwordHash'> & { profile: UserProfile | null };
    job: { id: string; jobTitle: string }; // Include job context
  }
> => {
  // 1. Get the company associated with the requesting user
  const company = await prisma.company.findUnique({
    where: { userId: companyUserId },
    select: { id: true },
  });
  if (!company) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'User is not associated with a company',
    );
  }
  const userCompanyId = company.id;

  // 2. Fetch the application, including related job (for companyId) and applicant (with profile)
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        // Need job to verify ownership
        select: { companyId: true, id: true, jobTitle: true },
      },
      applicant: {
        // Need applicant details
        include: {
          profile: {
            include: {
              educationCertificates: true,
              workExperiences: true,
            },
          }, // Include the applicant's profile
        },
      },
    },
  });

  // 3. Check if application exists
  if (!application) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Application not found');
  }

  // 4. Verify the job associated with the application belongs to the user's company
  if (application.job.companyId !== userCompanyId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You do not have permission to view this application',
    );
  }

  // 5. Remove sensitive data from the applicant object before returning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...applicantWithoutPassword } =
    application.applicant;

  // 6. Structure and return the result
  return {
    ...application,
    applicant: {
      ...applicantWithoutPassword,
      // Profile is already included from the query
    },
    // Job info already included minimally
  };
};

/**
 * Get all applications for a specific applicant.
 * @param applicantId - The ID of the applicant
 * @returns {Promise<Application[]>}
 * @throws {ApiError} If applicant ID is not provided or invalid.
 */
export const getMyApplications = async (
  applicantId: string,
): Promise<Application[]> => {
  if (!applicantId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Applicant ID is required');
  }

  const applications = await prisma.application.findMany({
    where: { applicantId },
    include: {
      job: {
        include: {
          company: true,
        },
      },
    },
  });

  return applications;
};
