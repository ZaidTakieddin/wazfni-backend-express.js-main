/*
  Warnings:

  - Added the required column `contractType` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('REMOTE', 'HYBRID', 'ON_SITE');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "contractType" "ContractType" NOT NULL;
