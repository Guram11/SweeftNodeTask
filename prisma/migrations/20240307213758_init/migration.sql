/*
  Warnings:

  - The `role` column on the `Company` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'admin';
