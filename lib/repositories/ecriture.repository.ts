// Repository pour les écritures comptables
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Include standard pour les écritures
 */
const ECRITURE_INCLUDE = {
  facture: {
    select: {
      id: true,
      reference: true,
      type_facture: true,
      fournisseur: true,
      total_ttc: true,
      client: {
        select: {
          nom: true,
          societe: true
        }
      }
    }
  },
  factureVente: {
    select: {
      id: true,
      reference: true,
      type_facture: true,
      clientdefacture: true,
      total_ttc: true,
      client: {
        select: {
          nom: true,
          societe: true
        }
      }
    }
  },
  journalBanque: {
    select: {
      id: true,
      date: true,
      numero_compte: true,
      titulaire: true,
      client: {
        select: {
          nom: true,
          societe: true
        }
      }
    }
  },
  planComptable: {
    select: {
      num_compte: true,
      libelle: true,
      type_compte: true
    }
  }
};

export const ecritureRepository = {
  /**
   * Récupère les écritures avec filtres
   */
  async findMany(whereClause: Prisma.EcritureComptableWhereInput) {
    return prisma.ecritureComptable.findMany({
      where: whereClause,
      include: ECRITURE_INCLUDE,
      orderBy: [
        { date: 'desc' },
        { factureId: 'desc' }
      ]
    });
  },

  /**
   * Crée une écriture comptable
   */
  async create(data: Prisma.EcritureComptableCreateInput) {
    return prisma.ecritureComptable.create({
      data,
      include: ECRITURE_INCLUDE
    });
  },

  /**
   * Crée plusieurs écritures en transaction
   */
  async createMany(ecritures: Prisma.EcritureComptableCreateInput[]) {
    return prisma.$transaction(
      ecritures.map(ecriture =>
        prisma.ecritureComptable.create({
          data: ecriture,
          include: ECRITURE_INCLUDE
        })
      )
    );
  },

  /**
   * Supprime les écritures d'une facture
   */
  async deleteByFactureId(factureId: string) {
    return prisma.ecritureComptable.deleteMany({
      where: { factureId }
    });
  },

  /**
   * Supprime les écritures d'une facture de vente
   */
  async deleteByFactureVenteId(factureVenteId: string) {
    return prisma.ecritureComptable.deleteMany({
      where: { factureVenteId }
    });
  },

  /**
   * Supprime les écritures d'un journal banque
   */
  async deleteByJournalBanqueId(journalBanqueId: string) {
    return prisma.ecritureComptable.deleteMany({
      where: { journalBanqueId }
    });
  },

  /**
   * Vérifie si des écritures existent pour une facture
   */
  async existsByFactureId(factureId: string): Promise<boolean> {
    const count = await prisma.ecritureComptable.count({
      where: { factureId }
    });
    return count > 0;
  }
};
