-- AlterTable
ALTER TABLE "EcritureComptable" ADD COLUMN     "factureVenteId" TEXT,
ALTER COLUMN "factureId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "FactureVente" (
    "id" TEXT NOT NULL,
    "clientUid" TEXT NOT NULL,
    "clientSte" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "total_ht" DOUBLE PRECISION NOT NULL,
    "tva_19" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tva_13" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tva_7" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_tva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_ttc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remise" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fdcs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timbre_fiscal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "FactureVente_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FactureVente" ADD CONSTRAINT "FactureVente_clientUid_fkey" FOREIGN KEY ("clientUid") REFERENCES "Client"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcritureComptable" ADD CONSTRAINT "EcritureComptable_factureVenteId_fkey" FOREIGN KEY ("factureVenteId") REFERENCES "FactureVente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
