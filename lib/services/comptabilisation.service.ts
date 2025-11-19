// Service de comptabilisation unifié pour tous les types de documents
import { ecritureRepository } from '@/lib/repositories/ecriture.repository';
import { comptableRepository } from '@/lib/repositories/comptable.repository';
import { journalAchatRepository, journalVenteRepository, journalBanqueRepository } from '@/lib/repositories/journal.repository';
import { generateAccountingEntries, generateJournalBanqueEntries } from '@/lib/gemini';
import { Prisma } from '@prisma/client';

export type DocumentType = 'achat' | 'vente' | 'banque';

interface ComptabilisationParams {
  documentId: string;
  documentType: DocumentType;
  comptableId: string;
  useGemini?: boolean;
}

interface ComptabilisationResult {
  success: boolean;
  ecrituresCount: number;
  equilibre: {
    totalDebit: number;
    totalCredit: number;
    equilibre: boolean;
  };
  method: 'GEMINI_AI' | 'STATIC_RULES';
}

export const comptabilisationService = {
  /**
   * Comptabilise un document (facture achat, vente ou journal banque)
   */
  async comptabiliser(params: ComptabilisationParams): Promise<ComptabilisationResult> {
    const { documentId, documentType, comptableId, useGemini = true } = params;

    // Récupérer le document
    const document = await this.getDocument(documentId, documentType);
    if (!document) {
      throw new Error('Document non trouvé');
    }

    // Vérifier si déjà comptabilisé
    if (document.status === 'COMPTABILISE' || document.status === 'VALIDATED') {
      throw new Error('Document déjà comptabilisé');
    }

    // Récupérer le plan comptable
    const planComptable = await comptableRepository.getPlanComptable(comptableId);
    if (planComptable.length === 0) {
      throw new Error('Plan comptable vide');
    }

    // Générer les écritures
    let ecritures: any[];
    let method: 'GEMINI_AI' | 'STATIC_RULES' = 'STATIC_RULES';

    if (useGemini) {
      try {
        const geminiResult = documentType === 'banque'
          ? await generateJournalBanqueEntries(document, planComptable)
          : await generateAccountingEntries(document, planComptable);

        ecritures = geminiResult.ecritures;
        method = 'GEMINI_AI';
      } catch (error) {
        console.warn('Gemini AI failed, falling back to static rules:', error);
        ecritures = this.generateStaticEcritures(document, planComptable, documentType);
      }
    } else {
      ecritures = this.generateStaticEcritures(document, planComptable, documentType);
    }

    // Créer les écritures en base
    const ecrituresCreated = await this.createEcritures(
      ecritures,
      documentId,
      documentType,
      document.date,
      planComptable
    );

    // Mettre à jour le statut du document
    await this.updateDocumentStatus(documentId, documentType, 'COMPTABILISE');

    // Calculer l'équilibre
    const totalDebit = ecrituresCreated.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = ecrituresCreated.reduce((sum, e) => sum + e.credit, 0);
    const equilibre = Math.abs(totalDebit - totalCredit) < 0.01;

    return {
      success: true,
      ecrituresCount: ecrituresCreated.length,
      equilibre: { totalDebit, totalCredit, equilibre },
      method
    };
  },

  /**
   * Récupère un document selon son type
   */
  async getDocument(documentId: string, documentType: DocumentType) {
    switch (documentType) {
      case 'achat':
        return journalAchatRepository.findById(documentId);
      case 'vente':
        return journalVenteRepository.findById(documentId);
      case 'banque':
        return journalBanqueRepository.findById(documentId);
    }
  },

  /**
   * Génère des écritures avec les règles statiques (fallback)
   */
  generateStaticEcritures(document: any, planComptable: any[], documentType: DocumentType) {
    const ecritures: any[] = [];

    if (documentType === 'achat') {
      // Compte de charge (6XXXXX)
      const compteCharge = planComptable.find(c => c.num_compte.startsWith('6'));
      if (compteCharge) {
        ecritures.push({
          num_compte: compteCharge.num_compte,
          libelle: compteCharge.libelle,
          debit: document.total_ht,
          credit: 0
        });
      }

      // Compte TVA (4455XXX)
      if (document.total_tva > 0) {
        const compteTVA = planComptable.find(c => c.num_compte.startsWith('4455'));
        if (compteTVA) {
          ecritures.push({
            num_compte: compteTVA.num_compte,
            libelle: 'TVA déductible',
            debit: document.total_tva,
            credit: 0
          });
        }
      }

      // Compte fournisseur (401XXXX)
      const compteFournisseur = planComptable.find(c => c.num_compte.startsWith('401'));
      if (compteFournisseur) {
        ecritures.push({
          num_compte: compteFournisseur.num_compte,
          libelle: 'Fournisseurs',
          debit: 0,
          credit: document.total_ttc
        });
      }
    } else if (documentType === 'vente') {
      // Compte client (411XXXX)
      const compteClient = planComptable.find(c => c.num_compte.startsWith('411'));
      if (compteClient) {
        ecritures.push({
          num_compte: compteClient.num_compte,
          libelle: 'Clients',
          debit: document.total_ttc,
          credit: 0
        });
      }

      // Compte produit (7XXXXX)
      const compteProduit = planComptable.find(c => c.num_compte.startsWith('7'));
      if (compteProduit) {
        ecritures.push({
          num_compte: compteProduit.num_compte,
          libelle: compteProduit.libelle,
          debit: 0,
          credit: document.total_ht
        });
      }

      // Compte TVA collectée (4457XXX)
      if (document.total_tva > 0) {
        const compteTVA = planComptable.find(c => c.num_compte.startsWith('4457'));
        if (compteTVA) {
          ecritures.push({
            num_compte: compteTVA.num_compte,
            libelle: 'TVA collectée',
            debit: 0,
            credit: document.total_tva
          });
        }
      }
    }

    return ecritures;
  },

  /**
   * Crée les écritures en base de données
   */
  async createEcritures(
    ecritures: any[],
    documentId: string,
    documentType: DocumentType,
    date: string,
    planComptable: any[]
  ) {
    const ecrituresData: Prisma.EcritureComptableCreateInput[] = [];

    for (const ecriture of ecritures) {
      const compte = planComptable.find(c => c.num_compte === ecriture.num_compte);
      if (!compte) continue;

      const data: Prisma.EcritureComptableCreateInput = {
        planComptable: { connect: { id: compte.id } },
        libelle: ecriture.libelle,
        num_compte: ecriture.num_compte,
        debit: ecriture.debit || 0,
        credit: ecriture.credit || 0,
        date: new Date(date)
      };

      // Connecter au bon type de document
      if (documentType === 'achat') {
        data.facture = { connect: { id: documentId } };
      } else if (documentType === 'vente') {
        data.factureVente = { connect: { id: documentId } };
      } else if (documentType === 'banque') {
        data.journalBanque = { connect: { id: documentId } };
      }

      ecrituresData.push(data);
    }

    return ecritureRepository.createMany(ecrituresData);
  },

  /**
   * Met à jour le statut d'un document
   */
  async updateDocumentStatus(documentId: string, documentType: DocumentType, status: string) {
    switch (documentType) {
      case 'achat':
        return journalAchatRepository.update(documentId, { status });
      case 'vente':
        return journalVenteRepository.update(documentId, { status });
      case 'banque':
        return journalBanqueRepository.update(documentId, { status });
    }
  }
};
