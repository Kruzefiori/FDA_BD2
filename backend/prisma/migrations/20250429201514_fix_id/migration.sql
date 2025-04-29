/*
  Warnings:

  - The primary key for the `Drug` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `drugName` on the `RelAdverseReactionXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugStrength` on the `RelAdverseReactionXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugName` on the `RelReportXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugStrength` on the `RelReportXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugName` on the `Shortages` table. All the data in the column will be lost.
  - You are about to drop the column `drugStrength` on the `Shortages` table. All the data in the column will be lost.
  - Added the required column `drugId` to the `RelAdverseReactionXDrug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugId` to the `RelReportXDrug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugId` to the `Shortages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RelAdverseReactionXDrug" DROP CONSTRAINT "RelAdverseReactionXDrug_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "RelReportXDrug" DROP CONSTRAINT "RelReportXDrug_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "Shortages" DROP CONSTRAINT "Shortages_drugName_drugStrength_fkey";

-- DropIndex
DROP INDEX "Drug_name_key";

-- AlterTable
ALTER TABLE "Drug" DROP CONSTRAINT "Drug_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Drug_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "RelAdverseReactionXDrug" DROP COLUMN "drugName",
DROP COLUMN "drugStrength",
ADD COLUMN     "drugId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "RelReportXDrug" DROP COLUMN "drugName",
DROP COLUMN "drugStrength",
ADD COLUMN     "drugId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Shortages" DROP COLUMN "drugName",
DROP COLUMN "drugStrength",
ADD COLUMN     "drugId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Shortages" ADD CONSTRAINT "Shortages_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXDrug" ADD CONSTRAINT "RelAdverseReactionXDrug_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelReportXDrug" ADD CONSTRAINT "RelReportXDrug_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;
