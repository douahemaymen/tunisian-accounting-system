/*
  Warnings:

  - You are about to drop the `AccountingConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GlobalAccountingConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AccountingConfig" DROP CONSTRAINT "AccountingConfig_clientUid_fkey";

-- DropTable
DROP TABLE "public"."AccountingConfig";

-- DropTable
DROP TABLE "public"."GlobalAccountingConfig";

-- CreateTable
CREATE TABLE "PlanComptable" (
    "id" TEXT NOT NULL,
    "comptableId" TEXT NOT NULL,
    "num_compte" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "type_compte" TEXT,

    CONSTRAINT "PlanComptable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcritureComptable" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "libelle" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "EcritureComptable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlanComptable" ADD CONSTRAINT "PlanComptable_comptableId_fkey" FOREIGN KEY ("comptableId") REFERENCES "Comptable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcritureComptable" ADD CONSTRAINT "EcritureComptable_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcritureComptable" ADD CONSTRAINT "EcritureComptable_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanComptable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
