/*
  Warnings:

  - Added the required column `libelle` to the `EcritureComptable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `num_compte` to the `EcritureComptable` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EcritureComptable" ADD COLUMN     "libelle" TEXT NOT NULL,
ADD COLUMN     "num_compte" TEXT NOT NULL;
