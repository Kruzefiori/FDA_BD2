-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shortages" (
    "id" SERIAL NOT NULL,
    "drugId" INTEGER NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "description" TEXT,
    "initialPostingDate" TIMESTAMP(3) NOT NULL,
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
CREATE TABLE "AdverseReaction" (
    "name" TEXT NOT NULL,

    CONSTRAINT "AdverseReaction_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "occurCountry" TEXT NOT NULL,
    "transmissionDate" TIMESTAMP(3) NOT NULL,
    "patientAge" INTEGER,
    "patientGender" TEXT,
    "patientWeight" INTEGER,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveIngredient" (
    "name" TEXT NOT NULL,
    "strength" TEXT NOT NULL,

    CONSTRAINT "ActiveIngredient_pkey" PRIMARY KEY ("name","strength")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "activeIngredientName" TEXT NOT NULL,
    "activeIngredientStrength" TEXT NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "drugId" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelAdverseReactionXDrug" (
    "id" SERIAL NOT NULL,
    "drugName" TEXT NOT NULL,
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
    "drugId" INTEGER NOT NULL,

    CONSTRAINT "RelReportXDrug_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drug" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,

    CONSTRAINT "Drug_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Shortages" ADD CONSTRAINT "Shortages_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_activeIngredientName_activeIngredientStrength_fkey" FOREIGN KEY ("activeIngredientName", "activeIngredientStrength") REFERENCES "ActiveIngredient"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXDrug" ADD CONSTRAINT "RelAdverseReactionXDrug_id_fkey" FOREIGN KEY ("id") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXDrug" ADD CONSTRAINT "RelAdverseReactionXDrug_adverseReaction_fkey" FOREIGN KEY ("adverseReaction") REFERENCES "AdverseReaction"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXReport" ADD CONSTRAINT "RelAdverseReactionXReport_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXReport" ADD CONSTRAINT "RelAdverseReactionXReport_adverseReaction_fkey" FOREIGN KEY ("adverseReaction") REFERENCES "AdverseReaction"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelReportXDrug" ADD CONSTRAINT "RelReportXDrug_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelReportXDrug" ADD CONSTRAINT "RelReportXDrug_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drug" ADD CONSTRAINT "Drug_companyName_fkey" FOREIGN KEY ("companyName") REFERENCES "Company"("name") ON DELETE CASCADE ON UPDATE CASCADE;
