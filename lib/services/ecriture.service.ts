// Service métier pour la génération et gestion des écritures comptables
import { ecritureRepository } from '@/lib/repositories/ecriture.repository';
import { comptableRepository } from '@/lib/repositories/comptable.repository';
import { generateAccountingEntries } from '@/lib/gemini';
import { Prisma } from '@prisma/client';

interface GenerateEcrituresParams {
  factureId: string;
  factureData: any;
  comptableId: string;
  factureType: 'achat' | 'vente' | 'banque';
}

interface EcritureData {
  num_compte: string;
  libelle: string;
  debit: number;
  credit: number;
}

export const ecritureService = {
  /**
   * Génère les écritures comptables pour une facture avec Gemini
   */
  async generateEcritures(params: GenerateEcrituresParams) {
    const { factureId, factureData, comptableId, factureType } = params;

    // Récupérer le plan comptable
    const planComptable = await comptableRepository.getPlanComptable(comptableId);

    if (planComptable.length === 0) {
      throw new Error('Aucun plan comptable trouvé. Veuillez d\'abord créer votre plan comptable.');
    }

    // Vérifier si des écritures existent déjà
    const existingEcritures = await ecritureRepository.findMany({
      factureId: factureType === 'achat' ? factureId : undefined,
      factureVenteId: factureType === 'vente' ? factureId : undefined,
      journalBanqueId: factureType === 'banque' ? factureId : undefined
    });

    if (existingEcritures.length > 0) {
      throw new Error('Des écritures comptables existent déjà pour cette facture');
    }

    // Générer les écritures avec Gemini
    const geminiResult = await generateAccountingEntries(factureData, planComptable);

    // Valider et créer les écritures
    const ecrituresCreated = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const ecriture of geminiResult.ecritures) {
      const compte = planComptable.find(c => c.num_compte === ecriture.num_compte);
      
      if (!compte) {
        console.warn(`Compte ${ecriture.num_compte} non trouvé dans le plan comptable`);
        continue;
      }

      const ecritureData: Prisma.EcritureComptableCreateInput = {
        planComptable: { connect: { id: compte.id } },
        libelle: ecriture.libelle,
        num_compte: ecriture.num_compte,
        debit: ecriture.debit || 0,
        credit: ecriture.credit || 0,
        date: new Date(factureData.date)
      };

      // Connecter à la bonne facture selon le type
      if (factureType === 'achat') {
        ecritureData.facture = { connect: { id: factureId } };
      } else if (factureType === 'vente') {
        ecritureData.factureVente = { connect: { id: factureId } };
      } else if (factureType === 'banque') {
        ecritureData.journalBanque = { connect: { id: factureId } };
      }

      const ecritureCreated = await ecritureRepository.create(ecritureData);
      ecrituresCreated.push(ecritureCreated);
      
      totalDebit += ecriture.debit || 0;
      totalCredit += ecriture.credit || 0;
    }

    // Vérifier l'équilibre comptable
    const equilibre = Math.abs(totalDebit - totalCredit) < 0.01;
    
    return {
      ecritures: ecrituresCreated,
      equilibre: { totalDebit, totalCredit, equilibre },
      count: ecrituresCreated.length
    };
  },

  /**
   * Récupère les écritures d'un comptable avec filtres
   */
  async getEcrituresByComptable(comptableId: string, filters?: {
    clientUid?: string;
    factureId?: string;
    journalBanqueId?: string;
  }) {
    let whereClause: Prisma.EcritureComptableWhereInput = {};

    if (filters?.factureId) {
      // Recherche par facture spécifique
      whereClause.OR = [
        { factureId: filters.factureId },
        { factureVenteId: filters.factureId },
        { journalBanqueId: filters.factureId }
      ];
    } else if (filters?.journalBanqueId) {
      // Recherche par journal banque spécifique
      whereClause.journalBanqueId = filters.journalBanqueId;
    } else {
      // Filtrer par comptable
      whereClause.OR = [
        {
          facture: {
            client: {
              comptableId,
              ...(filters?.clientUid && { uid: filters.clientUid })
            }
          }
        },
        {
          factureVente: {
            client: {
              comptableId,
              ...(filters?.clientUid && { uid: filters.clientUid })
            }
          }
        },
        {
          journalBanque: {
            client: {
              comptableId,
              ...(filters?.clientUid && { uid: filters.clientUid })
            }
          }
        }
      ];
    }

    const ecritures = await ecritureRepository.findMany(whereClause);

    // Filtrer les écritures valides
    return ecritures.filter(e => 
      (e.facture || e.factureVente || e.journalBanque) && e.planComptable
    );
  },

  /**
   * Supprime les écritures d'une facture
   */
  async deleteEcrituresByFacture(factureId: string, factureType: 'achat' | 'vente' | 'banque') {
    switch (factureType) {
      case 'achat':
        return ecritureRepository.deleteByFactureId(factureId);
      case 'vente':
        return ecritureRepository.deleteByFactureVenteId(factureId);
      case 'banque':
        return ecritureRepository.deleteByJournalBanqueId(factureId);
    }
  }
};
