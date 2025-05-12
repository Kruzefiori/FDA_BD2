/*
  Warnings:

  - The primary key for the `Drug` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dosageForm` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `route` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `strength` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `drugName` on the `RelActiveIngredientXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugStrength` on the `RelActiveIngredientXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugName` on the `RelAdverseReactionXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugStrength` on the `RelAdverseReactionXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugName` on the `RelReportXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugStrength` on the `RelReportXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugName` on the `Shortages` table. All the data in the column will be lost.
  - You are about to drop the column `drugStrength` on the `Shortages` table. All the data in the column will be lost.
  - You are about to drop the `RelCompanyXDrug` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `drugName` to the `Drug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugStrength` to the `Drug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugId` to the `RelActiveIngredientXDrug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugId` to the `RelAdverseReactionXDrug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugId` to the `RelReportXDrug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugId` to the `Shortages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RelActiveIngredientXDrug" DROP CONSTRAINT "RelActiveIngredientXDrug_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "RelAdverseReactionXDrug" DROP CONSTRAINT "RelAdverseReactionXDrug_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "RelCompanyXDrug" DROP CONSTRAINT "RelCompanyXDrug_companyName_fkey";

-- DropForeignKey
ALTER TABLE "RelCompanyXDrug" DROP CONSTRAINT "RelCompanyXDrug_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "RelReportXDrug" DROP CONSTRAINT "RelReportXDrug_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "Shortages" DROP CONSTRAINT "Shortages_drugName_drugStrength_fkey";

-- AlterTable
ALTER TABLE "Drug" DROP CONSTRAINT "Drug_pkey",
DROP COLUMN "dosageForm",
DROP COLUMN "name",
DROP COLUMN "route",
DROP COLUMN "strength",
ADD COLUMN     "drugName" TEXT NOT NULL,
ADD COLUMN     "drugStrength" TEXT NOT NULL,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Drug_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "RelActiveIngredientXDrug" DROP COLUMN "drugName",
DROP COLUMN "drugStrength",
ADD COLUMN     "drugId" INTEGER NOT NULL;

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

-- DropTable
DROP TABLE "RelCompanyXDrug";

-- CreateTable
CREATE TABLE "DrugBase" (
    "name" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "route" TEXT NOT NULL,

    CONSTRAINT "DrugBase_pkey" PRIMARY KEY ("name","strength")
);

-- AddForeignKey
ALTER TABLE "Shortages" ADD CONSTRAINT "Shortages_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelActiveIngredientXDrug" ADD CONSTRAINT "RelActiveIngredientXDrug_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXDrug" ADD CONSTRAINT "RelAdverseReactionXDrug_id_fkey" FOREIGN KEY ("id") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelReportXDrug" ADD CONSTRAINT "RelReportXDrug_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drug" ADD CONSTRAINT "Drug_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "DrugBase"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;
