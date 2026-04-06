-- CreateEnum
CREATE TYPE "Specialization" AS ENUM ('electronics', 'electrical', 'mechanical', 'IT', 'civil');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "specialization" "Specialization";
