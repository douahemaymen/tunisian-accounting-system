/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the `Facture` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FactureVente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Mouvement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MouvementBanque` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sessionToken]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expires` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionToken` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."EcritureComptable" DROP CONSTRAINT "EcritureComptable_factureId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EcritureComptable" DROP CONSTRAINT "EcritureComptable_factureVenteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Facture" DROP CONSTRAINT "Facture_clientUid_fkey";

-- DropForeignKey
ALTER TABLE "public"."FactureVente" DROP CONSTRAINT "FactureVente_clientUid_fkey";

-- DropForeignKey
ALTER TABLE "public"."Mouvement" DROP CONSTRAINT "Mouvement_banqueId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MouvementBanque" DROP CONSTRAINT "MouvementBanque_clientUid_fkey";

-- DropIndex
DROP INDEX "public"."Session_token_key";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "token",
ADD COLUMN     "expires" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "sessionToken" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Facture";

-- DropTable
DROP TABLE "public"."FactureVente";

-- DropTable
DROP TABLE "public"."Mouvement";

-- DropTable
DROP TABLE "public"."MouvementBanque";

-- CreateTable
CREATE TABLE "JournalAchat" (
    "id" TEXT NOT NULL,
    "clientUid" TEXT NOT NULL,
    "type_facture" TEXT NOT NULL,
    "fournisseur" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "total_ht" DOUBLE PRECISION NOT NULL,
    "tva_19" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tva_13" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tva_7" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_tva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_ttc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remise" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timbre_fiscal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image_url" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "accounting_entries" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "JournalAchat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalVente" (
    "id" TEXT NOT NULL,
    "clientUid" TEXT NOT NULL,
    "type_facture" TEXT NOT NULL,
    "clientdefacture" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "total_ht" DOUBLE PRECISION NOT NULL,
    "tva_19" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tva_13" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tva_7" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_tva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_ttc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remise" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timbre_fiscal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image_url" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL,
    "accounting_entries" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "JournalVente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- AddForeignKey
ALTER TABLE "JournalAchat" ADD CONSTRAINT "JournalAchat_clientUid_fkey" FOREIGN KEY ("clientUid") REFERENCES "Client"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalVente" ADD CONSTRAINT "JournalVente_clientUid_fkey" FOREIGN KEY ("clientUid") REFERENCES "Client"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcritureComptable" ADD CONSTRAINT "EcritureComptable_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "JournalAchat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcritureComptable" ADD CONSTRAINT "EcritureComptable_factureVenteId_fkey" FOREIGN KEY ("factureVenteId") REFERENCES "JournalVente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
