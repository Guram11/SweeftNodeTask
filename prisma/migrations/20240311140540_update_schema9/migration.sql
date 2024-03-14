/*
  Warnings:

  - You are about to drop the `_CompanyToConsumer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `companyId` to the `Consumer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_CompanyToConsumer" DROP CONSTRAINT "_CompanyToConsumer_A_fkey";

-- DropForeignKey
ALTER TABLE "_CompanyToConsumer" DROP CONSTRAINT "_CompanyToConsumer_B_fkey";

-- AlterTable
ALTER TABLE "Consumer" ADD COLUMN     "companyId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_CompanyToConsumer";

-- AddForeignKey
ALTER TABLE "Consumer" ADD CONSTRAINT "Consumer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
