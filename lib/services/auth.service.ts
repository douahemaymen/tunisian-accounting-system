// Service d'authentification et autorisation
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { comptableRepository } from '@/lib/repositories/comptable.repository';

export const authService = {
  /**
   * Récupère la session utilisateur
   */
  async getSession() {
    return getServerSession(authOptions);
  },

  /**
   * Vérifie l'authentification et retourne l'utilisateur
   */
  async requireAuth() {
    const session = await this.getSession();
    
    if (!session?.user?.id) {
      throw new Error('Non autorisé');
    }
    
    return session.user;
  },

  /**
   * Récupère le comptable de l'utilisateur connecté
   */
  async getComptable() {
    const user = await this.requireAuth();
    
    const comptable = await comptableRepository.findByUserId(user.id);
    
    if (!comptable) {
      throw new Error('Comptable non trouvé');
    }
    
    return comptable;
  },

  /**
   * Vérifie si l'utilisateur a le rôle requis
   */
  async requireRole(role: string | string[]) {
    const user = await this.requireAuth();
    const roles = Array.isArray(role) ? role : [role];
    
    if (!roles.includes(user.role)) {
      throw new Error('Accès non autorisé');
    }
    
    return user;
  }
};
