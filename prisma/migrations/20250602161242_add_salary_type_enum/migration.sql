-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('FIXED', 'RANGE', 'NONE');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "salaryType" "SalaryType" NOT NULL DEFAULT 'NONE';
