/*
  Warnings:

  - You are about to drop the column `discontinuedDate` on the `Shortages` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Shortages` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Shortages` table. All the data in the column will be lost.
  - Added the required column `date` to the `Shortages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Shortages" DROP COLUMN "discontinuedDate",
DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;
