-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "disabledAt" TIMESTAMP(3),
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- Bootstrap settings and promote earliest existing user to ADMIN
INSERT INTO "AppSettings" ("id", "registrationOpen") VALUES (1, true);

UPDATE "User"
SET "role" = 'ADMIN'
WHERE "id" = (
  SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1
);
