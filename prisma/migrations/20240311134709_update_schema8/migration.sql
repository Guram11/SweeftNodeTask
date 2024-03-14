/*
  Warnings:

  - You are about to drop the column `consumers` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "consumers";

-- CreateTable
CREATE TABLE "Consumer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Consumer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CompanyToConsumer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Consumer_email_key" ON "Consumer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_CompanyToConsumer_AB_unique" ON "_CompanyToConsumer"("A", "B");

-- CreateIndex
CREATE INDEX "_CompanyToConsumer_B_index" ON "_CompanyToConsumer"("B");

-- AddForeignKey
ALTER TABLE "_CompanyToConsumer" ADD CONSTRAINT "_CompanyToConsumer_A_fkey" FOREIGN KEY ("A") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToConsumer" ADD CONSTRAINT "_CompanyToConsumer_B_fkey" FOREIGN KEY ("B") REFERENCES "Consumer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
