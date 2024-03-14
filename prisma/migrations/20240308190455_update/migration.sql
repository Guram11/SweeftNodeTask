-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "verified" BOOLEAN DEFAULT false,
ALTER COLUMN "subscription" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Token" (
    "companyId" TEXT NOT NULL,
    "token" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_token_key" ON "Token"("token");

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
