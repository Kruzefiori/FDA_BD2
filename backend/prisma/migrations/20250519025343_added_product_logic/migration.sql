/*
  Warnings:

  - You are about to drop the `DrugBase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RelActiveIngredientXDrug` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Drug" DROP CONSTRAINT "Drug_drugName_drugStrength_fkey";

-- DropForeignKey
ALTER TABLE "RelActiveIngredientXDrug" DROP CONSTRAINT "RelActiveIngredientXDrug_activeIngredientName_activeIngred_fkey";

-- DropForeignKey
ALTER TABLE "RelActiveIngredientXDrug" DROP CONSTRAINT "RelActiveIngredientXDrug_drugId_fkey";

-- DropTable
DROP TABLE "DrugBase";

-- DropTable
DROP TABLE "RelActiveIngredientXDrug";

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

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_activeIngredientName_activeIngredientStrength_fkey" FOREIGN KEY ("activeIngredientName", "activeIngredientStrength") REFERENCES "ActiveIngredient"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;
