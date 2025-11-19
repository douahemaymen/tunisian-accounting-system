import { prisma } from '@/lib/prisma';

export interface PlanComptableItem {
  id: string;
  comptableId: string;
  num_compte: string;
  libelle: string;
  type_compte: string | null;
  comptable?: {
    nom: string;
    societe: string;
  };
}

/**
 * Récupère tous les plans comptables de la base de données
 * @param comptableId - ID du comptable spécifique (optionnel)
 * @returns Promise<PlanComptableItem[]>
 */
export async function getAllPlansComptables(comptableId?: string): Promise<PlanComptableItem[]> {
  try {
    const whereClause = comptableId ? { comptableId } : {};

    const planComptable = await prisma.planComptable.findMany({
      where: whereClause,
      orderBy: { num_compte: 'asc' },
      include: {
        comptable: {
          select: {
            nom: true,
            societe: true
          }
        }
      }
    });

    return planComptable;
  } catch (error) {
    console.error('Erreur lors de la récupération des plans comptables:', error);
    throw new Error('Impossible de récupérer les plans comptables');
  }
}

/**
 * Récupère le plan comptable d'un comptable spécifique par son userId
 * @param userId - ID de l'utilisateur comptable
 * @returns Promise<PlanComptableItem[]>
 */
export async function getPlanComptableByUserId(userId: string): Promise<PlanComptableItem[]> {
  try {
    const comptable = await prisma.comptable.findUnique({
      where: { userId }
    });

    if (!comptable) {
      throw new Error('Comptable non trouvé');
    }

    return await getAllPlansComptables(comptable.id);
  } catch (error) {
    console.error('Erreur lors de la récupération du plan comptable par userId:', error);
    throw error;
  }
}

/**
 * Récupère un compte spécifique par son numéro
 * @param numCompte - Numéro du compte
 * @param comptableId - ID du comptable (optionnel)
 * @returns Promise<PlanComptableItem | null>
 */
export async function getCompteByNumber(numCompte: string, comptableId?: string): Promise<PlanComptableItem | null> {
  try {
    const whereClause: any = { num_compte: numCompte };
    if (comptableId) {
      whereClause.comptableId = comptableId;
    }

    const compte = await prisma.planComptable.findFirst({
      where: whereClause,
      include: {
        comptable: {
          select: {
            nom: true,
            societe: true
          }
        }
      }
    });

    return compte;
  } catch (error) {
    console.error('Erreur lors de la récupération du compte:', error);
    throw new Error('Impossible de récupérer le compte');
  }
}

/**
 * Récupère les statistiques des plans comptables
 * @returns Promise<{ totalComptes: number, comptablesAvecPlan: number }>
 */
export async function getPlansComptablesStats() {
  try {
    const totalComptes = await prisma.planComptable.count();
    
    const comptablesAvecPlan = await prisma.comptable.count({
      where: {
        planComptable: {
          some: {}
        }
      }
    });

    return {
      totalComptes,
      comptablesAvecPlan
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw new Error('Impossible de récupérer les statistiques');
  }
}