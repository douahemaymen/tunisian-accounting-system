// Repository pour les comptables et le plan comptable
import { prisma } from '@/lib/prisma';

export const comptableRepository = {
  /**
   * Trouve un comptable par userId
   */
  async findByUserId(userId: string) {
    return prisma.comptable.findUnique({
      where: { userId }
    });
  },

  /**
   * Récupère le plan comptable d'un comptable
   */
  async getPlanComptable(comptableId: string) {
    return prisma.planComptable.findMany({
      where: { comptableId },
      orderBy: { num_compte: 'asc' }
    });
  },

  /**
   * Trouve un compte spécifique par numéro
   */
  async findCompteByNumber(comptableId: string, numCompte: string) {
    return prisma.planComptable.findFirst({
      where: {
        comptableId,
        num_compte: numCompte
      }
    });
  }
};
