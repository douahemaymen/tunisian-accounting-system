// Repository pour les opérations Prisma sur les journaux
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Options de filtrage communes pour les journaux
 */
interface JournalFilters {
  clientUid: string;
  type_facture?: string;
  status?: string;
}

/**
 * Include standard pour les relations des journaux
 */
const JOURNAL_INCLUDE = {
  client: {
    select: {
      nom: true,
      societe: true,
      email: true
    }
  },
  ecritures: {
    include: {
      planComptable: {
        select: {
          num_compte: true,
          libelle: true,
          type_compte: true
        }
      }
    }
  }
};

/**
 * Repository pour JournalAchat
 */
export const journalAchatRepository = {
  async create(data: Prisma.JournalAchatCreateInput) {
    return prisma.journalAchat.create({ data });
  },

  async findMany(filters: JournalFilters) {
    const whereClause: Prisma.JournalAchatWhereInput = { clientUid: filters.clientUid };
    
    if (filters.type_facture) {
      whereClause.type_facture = filters.type_facture;
    }
    
    if (filters.status) {
      whereClause.status = filters.status;
    }

    return prisma.journalAchat.findMany({
      where: whereClause,
      include: JOURNAL_INCLUDE,
      orderBy: { created_at: 'desc' }
    });
  },

  async findById(id: string) {
    return prisma.journalAchat.findUnique({
      where: { id },
      include: JOURNAL_INCLUDE
    });
  },

  async update(id: string, data: Prisma.JournalAchatUpdateInput) {
    return prisma.journalAchat.update({
      where: { id },
      data,
      include: JOURNAL_INCLUDE
    });
  },

  async delete(id: string) {
    // Supprimer les écritures liées d'abord
    await prisma.ecritureComptable.deleteMany({
      where: { factureId: id }
    });
    
    return prisma.journalAchat.delete({ where: { id } });
  }
};

/**
 * Repository pour JournalVente
 */
export const journalVenteRepository = {
  async create(data: Prisma.JournalVenteCreateInput) {
    return prisma.journalVente.create({ data });
  },

  async findMany(filters: JournalFilters) {
    const whereClause: Prisma.JournalVenteWhereInput = { clientUid: filters.clientUid };
    
    if (filters.type_facture) {
      whereClause.type_facture = filters.type_facture;
    }
    
    if (filters.status) {
      whereClause.status = filters.status;
    }

    return prisma.journalVente.findMany({
      where: whereClause,
      include: JOURNAL_INCLUDE,
      orderBy: { created_at: 'desc' }
    });
  },

  async findById(id: string) {
    return prisma.journalVente.findUnique({
      where: { id },
      include: JOURNAL_INCLUDE
    });
  },

  async update(id: string, data: Prisma.JournalVenteUpdateInput) {
    return prisma.journalVente.update({
      where: { id },
      data,
      include: JOURNAL_INCLUDE
    });
  },

  async delete(id: string) {
    await prisma.ecritureComptable.deleteMany({
      where: { factureVenteId: id }
    });
    
    return prisma.journalVente.delete({ where: { id } });
  }
};

/**
 * Repository pour JournalBanque
 */
export const journalBanqueRepository = {
  async create(data: Prisma.JournalBanqueCreateInput) {
    return prisma.journalBanque.create({
      data,
      include: {
        ...JOURNAL_INCLUDE,
        mouvements: true
      }
    });
  },

  async findMany(filters: Omit<JournalFilters, 'type_facture'>) {
    const whereClause: Prisma.JournalBanqueWhereInput = { clientUid: filters.clientUid };
    
    if (filters.status) {
      whereClause.status = filters.status;
    }

    return prisma.journalBanque.findMany({
      where: whereClause,
      include: {
        ...JOURNAL_INCLUDE,
        mouvements: true
      },
      orderBy: { created_at: 'desc' }
    });
  },

  async findById(id: string) {
    return prisma.journalBanque.findUnique({
      where: { id },
      include: {
        ...JOURNAL_INCLUDE,
        mouvements: true
      }
    });
  },

  async update(id: string, data: Prisma.JournalBanqueUpdateInput) {
    return prisma.journalBanque.update({
      where: { id },
      data,
      include: {
        ...JOURNAL_INCLUDE,
        mouvements: true
      }
    });
  },

  async delete(id: string) {
    await prisma.ecritureComptable.deleteMany({
      where: { journalBanqueId: id }
    });
    
    return prisma.journalBanque.delete({ where: { id } });
  }
};
