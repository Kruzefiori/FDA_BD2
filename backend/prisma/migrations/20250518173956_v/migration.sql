/*
  Warnings:

  - The primary key for the `Drug` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `strength` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `drugStrength` on the `RelAdverseReactionXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugStrength` on the `RelReportXDrug` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "RelActiveIngredientXDrug" DROP CONSTRAINT "RelActiveIngredientXDrug_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "RelAdverseReactionXDrug" DROP CONSTRAINT "RelAdverseReactionXDrug_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "RelReportXDrug" DROP CONSTRAINT "RelReportXDrug_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "Shortages" DROP CONSTRAINT "Shortages_drugName_drugStrength_fkey";

-- AlterTable
ALTER TABLE "Drug" DROP CONSTRAINT "Drug_pkey",
DROP COLUMN "strength",
ADD CONSTRAINT "Drug_pkey" PRIMARY KEY ("name");

-- AlterTable
ALTER TABLE "RelAdverseReactionXDrug" DROP COLUMN "drugStrength";

-- AlterTable
ALTER TABLE "RelReportXDrug" DROP COLUMN "drugStrength";

-- AddForeignKey
ALTER TABLE "Shortages" ADD CONSTRAINT "Shortages_drugName_fkey" FOREIGN KEY ("drugName") REFERENCES "Drug"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelActiveIngredientXDrug" ADD CONSTRAINT "RelActiveIngredientXDrug_drugName_fkey" FOREIGN KEY ("drugName") REFERENCES "Drug"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXDrug" ADD CONSTRAINT "RelAdverseReactionXDrug_drugName_fkey" FOREIGN KEY ("drugName") REFERENCES "Drug"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelReportXDrug" ADD CONSTRAINT "RelReportXDrug_drugName_fkey" FOREIGN KEY ("drugName") REFERENCES "Drug"("name") ON DELETE CASCADE ON UPDATE CASCADE;
