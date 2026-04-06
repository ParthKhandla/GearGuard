-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_machineRefId_fkey";

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_machineRefId_fkey" FOREIGN KEY ("machineRefId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
