/*
  Warnings:

  - You are about to drop the column `drugCount` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the `ActiveIngredient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Drug` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Drug" DROP CONSTRAINT "Drug_companyName_fkey";

-- DropForeignKey
ALTER TABLE "RelActiveIngredientXDrug" DROP CONSTRAINT "RelActiveIngredientXDrug_activeIngredientName_activeIngred_fkey";

-- DropForeignKey
ALTER TABLE "RelActiveIngredientXDrug" DROP CONSTRAINT "RelActiveIngredientXDrug_drugName_fkey";

-- DropForeignKey
ALTER TABLE "RelAdverseReactionXDrug" DROP CONSTRAINT "RelAdverseReactionXDrug_drugName_fkey";

-- DropForeignKey
ALTER TABLE "RelReportXDrug" DROP CONSTRAINT "RelReportXDrug_drugName_fkey";

-- DropForeignKey
ALTER TABLE "Shortages" DROP CONSTRAINT "Shortages_drugName_fkey";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "drugCount";

-- DropTable
DROP TABLE "ActiveIngredient";

-- DropTable
DROP TABLE "Drug";

-- CreateTable
CREATE TABLE "drugs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,

    CONSTRAINT "drugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "drugId" INTEGER NOT NULL,
    "productNumber" TEXT NOT NULL,
    "referenceDrug" TEXT NOT NULL,
    "referenceStandard" TEXT NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "marketingStatus" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_ingredients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "strength" TEXT NOT NULL,

    CONSTRAINT "active_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_active_ingredients" (
    "productId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "strength" TEXT NOT NULL,

    CONSTRAINT "product_active_ingredients_pkey" PRIMARY KEY ("productId","ingredientId")
);

-- CreateTable
CREATE TABLE "_CompanyDrugs" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CompanyDrugs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "drugs_name_key" ON "drugs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "active_ingredients_name_strength_key" ON "active_ingredients"("name", "strength");

-- CreateIndex
CREATE INDEX "_CompanyDrugs_B_index" ON "_CompanyDrugs"("B");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "drugs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_active_ingredients" ADD CONSTRAINT "product_active_ingredients_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_active_ingredients" ADD CONSTRAINT "product_active_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "active_ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortages" ADD CONSTRAINT "Shortages_drugName_fkey" FOREIGN KEY ("drugName") REFERENCES "drugs"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelActiveIngredientXDrug" ADD CONSTRAINT "RelActiveIngredientXDrug_activeIngredientName_activeIngred_fkey" FOREIGN KEY ("activeIngredientName", "activeIngredientStrength") REFERENCES "active_ingredients"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelActiveIngredientXDrug" ADD CONSTRAINT "RelActiveIngredientXDrug_drugName_fkey" FOREIGN KEY ("drugName") REFERENCES "drugs"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelAdverseReactionXDrug" ADD CONSTRAINT "RelAdverseReactionXDrug_drugName_fkey" FOREIGN KEY ("drugName") REFERENCES "drugs"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelReportXDrug" ADD CONSTRAINT "RelReportXDrug_drugName_fkey" FOREIGN KEY ("drugName") REFERENCES "drugs"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyDrugs" ADD CONSTRAINT "_CompanyDrugs_A_fkey" FOREIGN KEY ("A") REFERENCES "Company"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyDrugs" ADD CONSTRAINT "_CompanyDrugs_B_fkey" FOREIGN KEY ("B") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
