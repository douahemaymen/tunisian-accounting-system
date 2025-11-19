-- AlterTable
ALTER TABLE "EcritureComptable" ADD COLUMN     "journalBanqueId" TEXT;

-- CreateTable
CREATE TABLE "JournalBanque" (
    "id" TEXT NOT NULL,
    "clientUid" TEXT NOT NULL,
    "solde_initiale" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totale_credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totale_debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totale_solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "JournalBanque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementJournal" (
    "id" TEXT NOT NULL,
    "journalBanqueId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "MouvementJournal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JournalBanque" ADD CONSTRAINT "JournalBanque_clientUid_fkey" FOREIGN KEY ("clientUid") REFERENCES "Client"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementJournal" ADD CONSTRAINT "MouvementJournal_journalBanqueId_fkey" FOREIGN KEY ("journalBanqueId") REFERENCES "JournalBanque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcritureComptable" ADD CONSTRAINT "EcritureComptable_journalBanqueId_fkey" FOREIGN KEY ("journalBanqueId") REFERENCES "JournalBanque"("id") ON DELETE CASCADE ON UPDATE CASCADE;
