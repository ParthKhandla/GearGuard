-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('active', 'inactive', 'under_maintenance', 'retired');

-- CreateTable
CREATE TABLE "machines" (
    "id" SERIAL NOT NULL,
    "machineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" "MachineStatus" NOT NULL DEFAULT 'active',
    "maintenanceIntervalDays" INTEGER NOT NULL,
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "machines_machineId_key" ON "machines"("machineId");

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
