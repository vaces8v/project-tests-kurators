-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DRAFT');

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "status" "TestStatus" NOT NULL DEFAULT 'DRAFT';
