-- CreateEnum
CREATE TYPE "CalendarSystem" AS ENUM ('GREGORIAN', 'JALALI');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "calendar" "CalendarSystem" NOT NULL DEFAULT 'JALALI';
