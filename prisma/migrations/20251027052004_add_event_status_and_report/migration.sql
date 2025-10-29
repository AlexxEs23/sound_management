-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('upcoming', 'ongoing', 'completed');

-- AlterTable
ALTER TABLE "Events" ADD COLUMN     "reportGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'upcoming';
