-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "passwordChangedAt" DROP NOT NULL,
ALTER COLUMN "passwordResetExpires" DROP NOT NULL,
ALTER COLUMN "passwordResetToken" DROP NOT NULL;
