/*
  Warnings:

  - The primary key for the `Drug` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `drugId` on the `RelActiveIngredientXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugId` on the `RelAdverseReactionXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `drugId` on the `RelReportXDrug` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Shortages` table. All the data in the column will be lost.
  - You are about to drop the column `drugId` on the `Shortages` table. All the data in the column will be lost.
  - Added the required column `drugName` to the `RelActiveIngredientXDrug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugStrength` to the `RelActiveIngredientXDrug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugName` to the `RelAdverseReactionXDrug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugStrength` to the `RelAdverseReactionXDrug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugName` to the `RelReportXDrug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugStrength` to the `RelReportXDrug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugName` to the `Shortages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `drugStrength` to the `Shortages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initialPostingDate` to the `Shortages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RelActiveIngredientXDrug" DROP CONSTRAINT "RelActiveIngredientXDrug_drugId_fkey";

-- DropForeignKey
ALTER TABLE "RelAdverseReactionXDrug" DROP CONSTRAINT "RelAdverseReactionXDrug_drugId_fkey";

-- DropForeignKey
ALTER TABLE "RelReportXDrug" DROP CONSTRAINT "RelReportXDrug_drugId_fkey";

-- DropForeignKey
ALTER TABLE "Shortages" DROP CONSTRAINT "Shortages_drugId_fkey";

-- AlterTable
ALTER TABLE "Drug" DROP CONSTRAINT "Drug_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Drug_pkey" PRIMARY KEY ("name", "strength");

-- AlterTable
ALTER TABLE "RelActiveIngredientXDrug" DROP COLUMN "drugId",
ADD COLUMN     "drugName" TEXT NOT NULL,
ADD COLUMN     "drugStrength" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RelAdverseReactionXDrug" DROP COLUMN "drugId",
ADD COLUMN     "drugName" TEXT NOT NULL,
ADD COLUMN     "drugStrength" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RelReportXDrug" DROP COLUMN "drugId",
ADD COLUMN     "drugName" TEXT NOT NULL,
ADD COLUMN     "drugStrength" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Shortages" DROP COLUMN "date",
DROP COLUMN "drugId",
ADD COLUMN     "drugName" TEXT NOT NULL,
ADD COLUMN     "drugStrength" TEXT NOT NULL,
ADD COLUMN     "initialPostingDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateTable
CREATE TABLE "RelCompanyXDrug" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "drugStrength" TEXT NOT NULL,

    CONSTRAINT "RelCompanyXDrug_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Shortages" ADD CONSTRAINT "Shortages_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "Drug"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelActiveIngredientXDrug" ADD CONSTRAINT "RelActiveIngredientXDrug_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "Drug"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXDrug" ADD CONSTRAINT "RelAdverseReactionXDrug_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "Drug"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelReportXDrug" ADD CONSTRAINT "RelReportXDrug_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "Drug"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelCompanyXDrug" ADD CONSTRAINT "RelCompanyXDrug_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "Drug"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelCompanyXDrug" ADD CONSTRAINT "RelCompanyXDrug_companyName_fkey" FOREIGN KEY ("companyName") REFERENCES "Company"("name") ON DELETE CASCADE ON UPDATE CASCADE;
