-- DropForeignKey
ALTER TABLE "public"."Client" DROP CONSTRAINT "Client_comptableId_fkey";

-- CreateTable
CREATE TABLE "Comptable" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "societe" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comptable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Comptable_userId_key" ON "Comptable"("userId");

-- AddForeignKey
ALTER TABLE "Comptable" ADD CONSTRAINT "Comptable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_comptableId_fkey" FOREIGN KEY ("comptableId") REFERENCES "Comptable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
