-- AlterTable
ALTER TABLE "users" ADD COLUMN     "otpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "resetOtp" TEXT;
