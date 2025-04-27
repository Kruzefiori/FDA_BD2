-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drug" (
    "name" TEXT NOT NULL,
    "dosageform" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "route" TEXT NOT NULL,

    CONSTRAINT "Drug_pkey" PRIMARY KEY ("name","strength")
);

-- CreateTable
CREATE TABLE "Shortages" (
    "id" SERIAL NOT NULL,
    "drugName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "discontinuedDate" TIMESTAMP(3) NOT NULL,
    "dosageform" TEXT NOT NULL,
    "drugStrength" TEXT NOT NULL,
    "presentation" TEXT NOT NULL,

    CONSTRAINT "Shortages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "name" TEXT NOT NULL,
    "drugCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "adverseReaction" (
    "name" TEXT NOT NULL,

    CONSTRAINT "adverseReaction_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" INTEGER NOT NULL,
    "occurCountry" TEXT NOT NULL,
    "transmissionDate" TIMESTAMP(3) NOT NULL,
    "patientAge" INTEGER,
    "patientGender" TEXT,
    "patientweight" INTEGER,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relAdverseReactionXDrug" (
    "id" SERIAL NOT NULL,
    "drugName" TEXT NOT NULL,
    "drugStrength" TEXT NOT NULL,
    "adverseReaction" TEXT NOT NULL,

    CONSTRAINT "relAdverseReactionXDrug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relAdverseReactionXReport" (
    "id" SERIAL NOT NULL,
    "ReportAdverseid" INTEGER NOT NULL,
    "adverseReaction" TEXT NOT NULL,

    CONSTRAINT "relAdverseReactionXReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relReportXDrug" (
    "id" SERIAL NOT NULL,
    "ReportAdverseid" INTEGER NOT NULL,
    "drugName" TEXT NOT NULL,
    "drugStrength" TEXT NOT NULL,

    CONSTRAINT "relReportXDrug_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Drug_name_key" ON "Drug"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyName_fkey" FOREIGN KEY ("companyName") REFERENCES "Company"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drug" ADD CONSTRAINT "Drug_companyName_fkey" FOREIGN KEY ("companyName") REFERENCES "Company"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortages" ADD CONSTRAINT "Shortages_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "Drug"("name", "strength") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relAdverseReactionXDrug" ADD CONSTRAINT "relAdverseReactionXDrug_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "Drug"("name", "strength") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relAdverseReactionXDrug" ADD CONSTRAINT "relAdverseReactionXDrug_adverseReaction_fkey" FOREIGN KEY ("adverseReaction") REFERENCES "adverseReaction"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relAdverseReactionXReport" ADD CONSTRAINT "relAdverseReactionXReport_adverseReaction_fkey" FOREIGN KEY ("adverseReaction") REFERENCES "adverseReaction"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relAdverseReactionXReport" ADD CONSTRAINT "relAdverseReactionXReport_ReportAdverseid_fkey" FOREIGN KEY ("ReportAdverseid") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relReportXDrug" ADD CONSTRAINT "relReportXDrug_drugName_drugStrength_fkey" FOREIGN KEY ("drugName", "drugStrength") REFERENCES "Drug"("name", "strength") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relReportXDrug" ADD CONSTRAINT "relReportXDrug_ReportAdverseid_fkey" FOREIGN KEY ("ReportAdverseid") REFERENCES "Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
