/*
  Warnings:

  - Added the required column `testId` to the `TestLink` table without a default value. This is not possible if the table is not empty.

*/
-- Delete existing test links
DELETE FROM "TestLink";

-- AlterTable
ALTER TABLE "TestLink" ADD COLUMN     "testId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TestLink" ADD CONSTRAINT "TestLink_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
