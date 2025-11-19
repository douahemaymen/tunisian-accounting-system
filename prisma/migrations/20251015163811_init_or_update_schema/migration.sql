-- CreateTable
CREATE TABLE "Client" (
    "uid" TEXT NOT NULL,
    "email" TEXT,
    "nom" TEXT NOT NULL,
    "societe" TEXT NOT NULL,
    "date_inscription" BIGINT,
    "statut" TEXT,
    "comptableId" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL,
    "clientUid" TEXT NOT NULL,
    "type_journal" TEXT NOT NULL,
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

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementBanque" (
    "id" TEXT NOT NULL,
    "clientUid" TEXT NOT NULL,
    "solde_initial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "solde_final" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" BIGINT NOT NULL,

    CONSTRAINT "MouvementBanque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mouvement" (
    "id" TEXT NOT NULL,
    "banqueId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "debit" DOUBLE PRECISION NOT NULL,
    "credit" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Mouvement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingConfig" (
    "id" TEXT NOT NULL,
    "clientUid" TEXT NOT NULL,
    "config" JSONB NOT NULL,

    CONSTRAINT "AccountingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalAccountingConfig" (
    "id" TEXT NOT NULL,
    "config" JSONB NOT NULL,

    CONSTRAINT "GlobalAccountingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "clientUid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingConfig_clientUid_key" ON "AccountingConfig"("clientUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clientUid_key" ON "User"("clientUid");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_comptableId_fkey" FOREIGN KEY ("comptableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_clientUid_fkey" FOREIGN KEY ("clientUid") REFERENCES "Client"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementBanque" ADD CONSTRAINT "MouvementBanque_clientUid_fkey" FOREIGN KEY ("clientUid") REFERENCES "Client"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mouvement" ADD CONSTRAINT "Mouvement_banqueId_fkey" FOREIGN KEY ("banqueId") REFERENCES "MouvementBanque"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingConfig" ADD CONSTRAINT "AccountingConfig_clientUid_fkey" FOREIGN KEY ("clientUid") REFERENCES "Client"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientUid_fkey" FOREIGN KEY ("clientUid") REFERENCES "Client"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
