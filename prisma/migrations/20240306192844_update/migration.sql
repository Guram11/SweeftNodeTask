/*
  Warnings:

  - The `role` column on the `Company` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `Employee` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `passwordChangedAt` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordResetExpires` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordResetToken` to the `Company` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "passwordChangedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "passwordResetToken" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" DEFAULT 'admin';

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "role",
ADD COLUMN     "role" "Role" DEFAULT 'user';
