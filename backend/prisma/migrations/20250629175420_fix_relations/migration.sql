/*
  Warnings:

  - Added the required column `drugId` to the `RelAdverseReactionXDrug` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RelAdverseReactionXDrug" DROP CONSTRAINT "RelAdverseReactionXDrug_id_fkey";

-- AlterTable
ALTER TABLE "RelAdverseReactionXDrug" ADD COLUMN     "drugId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXDrug" ADD CONSTRAINT "RelAdverseReactionXDrug_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;
