/*
  Warnings:

  - You are about to drop the column `categoryId` on the `CategoryClick` table. All the data in the column will be lost.
  - You are about to drop the `_CategoryToJob` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,subCategoryId]` on the table `CategoryClick` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subCategoryId` to the `CategoryClick` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CategoryClick" DROP CONSTRAINT "CategoryClick_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToJob" DROP CONSTRAINT "_CategoryToJob_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToJob" DROP CONSTRAINT "_CategoryToJob_B_fkey";

-- DropIndex
DROP INDEX "CategoryClick_categoryId_idx";

-- DropIndex
DROP INDEX "CategoryClick_userId_categoryId_key";

-- AlterTable
ALTER TABLE "CategoryClick" DROP COLUMN "categoryId",
ADD COLUMN     "subCategoryId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_CategoryToJob";

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_JobSubCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JobSubCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "SubCategory_categoryId_idx" ON "SubCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_name_categoryId_key" ON "SubCategory"("name", "categoryId");

-- CreateIndex
CREATE INDEX "_JobSubCategories_B_index" ON "_JobSubCategories"("B");

-- CreateIndex
CREATE INDEX "CategoryClick_subCategoryId_idx" ON "CategoryClick"("subCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryClick_userId_subCategoryId_key" ON "CategoryClick"("userId", "subCategoryId");

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryClick" ADD CONSTRAINT "CategoryClick_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobSubCategories" ADD CONSTRAINT "_JobSubCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobSubCategories" ADD CONSTRAINT "_JobSubCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
