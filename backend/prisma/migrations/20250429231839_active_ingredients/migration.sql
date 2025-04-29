-- CreateTable
CREATE TABLE "ActiveIngredient" (
    "name" TEXT NOT NULL,
    "strength" TEXT NOT NULL,

    CONSTRAINT "ActiveIngredient_pkey" PRIMARY KEY ("name","strength")
);

-- CreateTable
CREATE TABLE "RelActiveIngredientXDrug" (
    "id" SERIAL NOT NULL,
    "activeIngredientName" TEXT NOT NULL,
    "activeIngredientStrength" TEXT NOT NULL,
    "drugId" INTEGER NOT NULL,

    CONSTRAINT "RelActiveIngredientXDrug_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RelActiveIngredientXDrug" ADD CONSTRAINT "RelActiveIngredientXDrug_activeIngredientName_activeIngred_fkey" FOREIGN KEY ("activeIngredientName", "activeIngredientStrength") REFERENCES "ActiveIngredient"("name", "strength") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelActiveIngredientXDrug" ADD CONSTRAINT "RelActiveIngredientXDrug_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE CASCADE ON UPDATE CASCADE;
