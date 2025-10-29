/*
  Warnings:

  - You are about to drop the column `status` on the `EquipmentEvent` table. All the data in the column will be lost.
  - You are about to drop the column `condition` on the `Equipments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[equipmentId,eventId]` on the table `EquipmentEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('pending', 'in_progress', 'completed');

-- AlterTable
ALTER TABLE "EquipmentEvent" DROP COLUMN "status",
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Equipments" DROP COLUMN "condition";

-- DropEnum
DROP TYPE "public"."Status";

-- CreateTable
CREATE TABLE "DamagedEquipment" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "repairStatus" "RepairStatus" NOT NULL DEFAULT 'pending',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repairedAt" TIMESTAMP(3),

    CONSTRAINT "DamagedEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DamagedEquipment_equipmentId_idx" ON "DamagedEquipment"("equipmentId");

-- CreateIndex
CREATE INDEX "DamagedEquipment_repairStatus_idx" ON "DamagedEquipment"("repairStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentEvent_equipmentId_eventId_key" ON "EquipmentEvent"("equipmentId", "eventId");

-- AddForeignKey
ALTER TABLE "DamagedEquipment" ADD CONSTRAINT "DamagedEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
