/*
  Warnings:

  - You are about to drop the column `companyId` on the `Token` table. All the data in the column will be lost.
  - The required column `id` was added to the `Token` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_companyId_fkey";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "verified" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "Token" DROP COLUMN "companyId",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Token_pkey" PRIMARY KEY ("id");
