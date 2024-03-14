/*
  Warnings:

  - You are about to drop the column `restrictedTo` on the `File` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "registeredAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "File" DROP COLUMN "restrictedTo",
ADD COLUMN     "availableTo" TEXT[] DEFAULT ARRAY[]::TEXT[];
