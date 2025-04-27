/*
  Warnings:

  - You are about to drop the column `dosageform` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `patientweight` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `dosageform` on the `Shortages` table. All the data in the column will be lost.
  - You are about to drop the `adverseReaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `relAdverseReactionXDrug` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `relAdverseReactionXReport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `relReportXDrug` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dosageForm` to the `Drug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dosageForm` to the `Shortages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Drug" DROP CONSTRAINT "Drug_companyName_fkey";

-- DropForeignKey
ALTER TABLE "Shortages" DROP CONSTRAINT "Shortages_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_companyName_fkey";

-- DropForeignKey
ALTER TABLE "relAdverseReactionXDrug" DROP CONSTRAINT "relAdverseReactionXDrug_adverseReaction_fkey";

-- DropForeignKey
ALTER TABLE "relAdverseReactionXDrug" DROP CONSTRAINT "relAdverseReactionXDrug_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "relAdverseReactionXReport" DROP CONSTRAINT "relAdverseReactionXReport_ReportAdverseid_fkey";

-- DropForeignKey
ALTER TABLE "relAdverseReactionXReport" DROP CONSTRAINT "relAdverseReactionXReport_adverseReaction_fkey";

-- DropForeignKey
ALTER TABLE "relReportXDrug" DROP CONSTRAINT "relReportXDrug_ReportAdverseid_fkey";

-- DropForeignKey
ALTER TABLE "relReportXDrug" DROP CONSTRAINT "relReportXDrug_drugName_drugStrength_fkey";

-- AlterTable
ALTER TABLE "Drug" DROP COLUMN "dosageform",
ADD COLUMN     "dosageForm" TEXT NOT NULL;

-- AlterTable
CREATE SEQUENCE report_id_seq;
ALTER TABLE "Report" DROP COLUMN "patientweight",
ADD COLUMN     "patientWeight" INTEGER,
ALTER COLUMN "id" SET DEFAULT nextval('report_id_seq');
ALTER SEQUENCE report_id_seq OWNED BY "Report"."id";

-- AlterTable
ALTER TABLE "Shortages" DROP COLUMN "dosageform",
ADD COLUMN     "dosageForm" TEXT NOT NULL;

-- DropTable
DROP TABLE "adverseReaction";

-- DropTable
DROP TABLE "relAdverseReactionXDrug";

-- DropTable
DROP TABLE "relAdverseReactionXReport";

-- DropTable
DROP TABLE "relReportXDrug";

-- CreateTable
CREATE TABLE "AdverseReaction" (
    "name" TEXT NOT NULL,

    CONSTRAINT "AdverseReaction_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "RelAdverseReactionXDrug" (
    "id" SERIAL NOT NULL,
    "drugName" TEXT NOT NULL,
    "drugStrength" TEXT NOT NULL,
    "adverseReaction" TEXT NOT NULL,

    CONSTRAINT "RelAdverseReactionXDrug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelAdverseReactionXReport" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "adverseReaction" TEXT NOT NULL,

    CONSTRAINT "RelAdverseReactionXReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelReportXDrug" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "drugName" TEXT NOT NULL,
    "drugStrength" TEXT NOT NULL,

    CONSTRAINT "RelReportXDrug_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyName_fkey" FOREIGN KEY ("companyName") REFERENCES "Company"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drug" ADD CONSTRAINT "Drug_companyName_fkey" FOREIGN KEY ("companyName") REFERENCES "Company"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortages" ADD CONSTRAINT "Shortages_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "Drug"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXDrug" ADD CONSTRAINT "RelAdverseReactionXDrug_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "Drug"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXDrug" ADD CONSTRAINT "RelAdverseReactionXDrug_adverseReaction_fkey" FOREIGN KEY ("adverseReaction") REFERENCES "AdverseReaction"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXReport" ADD CONSTRAINT "RelAdverseReactionXReport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXReport" ADD CONSTRAINT "RelAdverseReactionXReport_adverseReaction_fkey" FOREIGN KEY ("adverseReaction") REFERENCES "AdverseReaction"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelReportXDrug" ADD CONSTRAINT "RelReportXDrug_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelReportXDrug" ADD CONSTRAINT "RelReportXDrug_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "Drug"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;
