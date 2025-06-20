/*
  Warnings:

  - Added the required column `product_number` to the `Drug` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Drug" ADD COLUMN     "product_number" INTEGER NOT NULL;
