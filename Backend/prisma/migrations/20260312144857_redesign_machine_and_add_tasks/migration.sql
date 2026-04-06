/*
  Warnings:

  - You are about to drop the column `status` on the `machines` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TaskSeverity" AS ENUM ('warning', 'critical');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('open', 'in_progress', 'resolved');

-- AlterTable
ALTER TABLE "machines" DROP COLUMN "status";

-- DropEnum
DROP TYPE "MachineStatus";

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "machineRefId" INTEGER NOT NULL,
    "reportedBy" INTEGER NOT NULL,
    "assignedTo" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "TaskSeverity" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_machineRefId_fkey" FOREIGN KEY ("machineRefId") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
