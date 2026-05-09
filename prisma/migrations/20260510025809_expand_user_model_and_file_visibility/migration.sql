-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER_DEFAULT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "UserProfileSex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserStatusOperatorType" AS ENUM ('SYSTEM', 'MANUAL');

-- CreateEnum
CREATE TYPE "FileDomain" AS ENUM ('AVATAR', 'DOCUMENT', 'VIDEO');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable: User — drop legacy columns, add new columns
ALTER TABLE "User"
    DROP COLUMN "nickname",
    DROP COLUMN "realname",
    ADD COLUMN "phone" TEXT,
    ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER_DEFAULT',
    ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN "bannedUntil" TIMESTAMP(3),
    ADD COLUMN "bannedReason" TEXT;

-- CreateIndex: User.phone (unique)
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- DropIndex: old createdAt index on User
DROP INDEX IF EXISTS "User_createdAt_idx";

-- CreateTable: UserProfile
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "nickname" TEXT,
    "avatarId" TEXT,
    "bio" TEXT,
    "sex" "UserProfileSex",
    "sexVisible" BOOLEAN NOT NULL DEFAULT true,
    "birthday" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable: UserStatusHistory
CREATE TABLE "UserStatusHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operatorType" "UserStatusOperatorType" NOT NULL,
    "operatorId" TEXT,
    "fromStatus" "UserStatus" NOT NULL,
    "toStatus" "UserStatus" NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: UserStatusHistory
CREATE INDEX "UserStatusHistory_userId_createdAt_idx" ON "UserStatusHistory"("userId", "createdAt");

-- AlterTable: File — drop legacy columns, change domain type, add visibility
ALTER TABLE "File"
    DROP COLUMN IF EXISTS "uploadId",
    DROP COLUMN IF EXISTS "sha256",
    DROP COLUMN IF EXISTS "updatedAt";

-- Change domain from TEXT to FileDomain enum (drop & re-add with default, then drop default)
ALTER TABLE "File" DROP COLUMN "domain";
ALTER TABLE "File" ADD COLUMN "domain" "FileDomain" NOT NULL DEFAULT 'DOCUMENT';
ALTER TABLE "File" ALTER COLUMN "domain" DROP DEFAULT;

-- Add visibility column
ALTER TABLE "File" ADD COLUMN "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE';

-- DropIndex: old File_status_idx and File_sha256_idx
DROP INDEX IF EXISTS "File_status_idx";
DROP INDEX IF EXISTS "File_sha256_idx";

-- CreateIndex: File(status, createdAt)
CREATE INDEX "File_status_createdAt_idx" ON "File"("status", "createdAt");

-- AddForeignKey: File.userId → User.id
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: UserProfile.userId → User.id
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: UserProfile.avatarId → File.id
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: UserStatusHistory.userId → User.id
ALTER TABLE "UserStatusHistory" ADD CONSTRAINT "UserStatusHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
