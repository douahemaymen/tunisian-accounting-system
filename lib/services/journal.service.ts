// Service métier pour la gestion des journaux
import { 
  journalAchatRepository, 
  journalVenteRepository, 
  journalBanqueRepository 
} from '@/lib/repositories/journal.repository';
import { parseNumericFields, FACTURE_NUMERIC_FIELDS } from '@/lib/utils/parsers';

/**
 * Type de journal
 */
export type JournalType = 'achat' | 'vente' | 'banque';

/**
 * Données pour créer un journal d'achat
 */
interface CreateJournalAchatData {
  clientUid: string;
  imageUrl: string;
  extractedData: any;
}

/**
 * Données pour créer un journal de vente
 */
interface CreateJournalVenteData {
  clientUid: string;
  imageUrl: string;
  extractedData: any;
}

/**
 * Données pour créer un journal banque
 */
interface CreateJournalBanqueData {
  clientUid: string;
  imageUrl: string;
  extractedData: any;
}

export const journalService = {
  /**
   * Crée un journal d'achat
   */
  async createJournalAchat(data: CreateJournalAchatData) {
    const { clientUid, imageUrl, extractedData } = data;
    
    // Parser les champs numériques
    const parsed = parseNumericFields(extractedData, FACTURE_NUMERIC_FIELDS);
    
    return journalAchatRepository.create({
      client: { connect: { uid: clientUid } },
      fournisseur: parsed.fournisseur ?? 'Inconnu',
      date: parsed.date ?? new Date().toISOString().slice(0, 10),
      reference: parsed.reference ?? '',
      total_ht: parsed.total_ht,
      total_ttc: parsed.total_ttc,
      total_tva: parsed.total_tva,
      tva_7: parsed.tva_7,
      tva_13: parsed.tva_13,
      tva_19: parsed.tva_19,
      remise: parsed.remise,
      timbre_fiscal: parsed.timbre_fiscal,
      type_facture: parsed.type_facture || 'FACTURE_ORDINAIRE_DT',
      image_url: imageUrl,
      created_at: BigInt(Date.now()),
      status: 'NON_COMPTABILISE'
    });
  },

  /**
   * Crée un journal de vente
   */
  async createJournalVente(data: CreateJournalVenteData) {
    const { clientUid, imageUrl, extractedData } = data;
    
    const parsed = parseNumericFields(extractedData, FACTURE_NUMERIC_FIELDS);
    
    return journalVenteRepository.create({
      client: { connect: { uid: clientUid } },
      type_facture: parsed.type_facture ?? 'VENTE_ORDINAIRE_DT',
      clientdefacture: parsed.clientdefacture ?? parsed.clientSte ?? 'Client',
      date: parsed.date ?? new Date().toISOString().slice(0, 10),
      reference: parsed.reference ?? '',
      total_ht: parsed.total_ht,
      total_ttc: parsed.total_ttc,
      total_tva: parsed.total_tva,
      tva_7: parsed.tva_7,
      tva_13: parsed.tva_13,
      tva_19: parsed.tva_19,
      remise: parsed.remise,
      timbre_fiscal: parsed.timbre_fiscal,
      image_url: imageUrl,
      created_at: BigInt(Date.now()),
      status: 'NON_COMPTABILISE'
    });
  },

  /**
   * Crée un journal banque
   */
  async createJournalBanque(data: CreateJournalBanqueData) {
    const { clientUid, imageUrl, extractedData } = data;
    
    return journalBanqueRepository.create({
      client: { connect: { uid: clientUid } },
      date: extractedData.date ?? new Date().toISOString().slice(0, 10),
      numero_compte: extractedData.numero_compte ?? extractedData.numeroCompte ?? 'N/A',
      titulaire: extractedData.titulaire ?? extractedData.client ?? 'Non spécifié',
      image_url: imageUrl,
      created_at: BigInt(Date.now()),
      status: 'NON_COMPTABILISE',
      mouvements: extractedData.mouvements ? {
        create: extractedData.mouvements.map((mouvement: any) => ({
          date: mouvement.date,
          libelle: mouvement.libelle,
          debit: parseFloat(mouvement.debit) || 0,
          credit: parseFloat(mouvement.credit) || 0
        }))
      } : undefined
    });
  },

  /**
   * Crée un journal banque avec écritures comptables
   */
  async createJournalBanqueWithEcritures(data: CreateJournalBanqueData & { ecrituresComptables?: any[] }) {
    const { clientUid, imageUrl, extractedData, ecrituresComptables } = data;
    
    // Créer le journal banque
    const journal = await journalBanqueRepository.create({
      client: { connect: { uid: clientUid } },
      date: extractedData.date ?? new Date().toISOString().slice(0, 10),
      numero_compte: extractedData.numero_compte ?? extractedData.numeroCompte ?? 'N/A',
      titulaire: extractedData.titulaire ?? extractedData.client ?? 'Non spécifié',
      image_url: imageUrl,
      created_at: BigInt(Date.now()),
      status: 'NON_COMPTABILISE',
      mouvements: extractedData.mouvements ? {
        create: extractedData.mouvements.map((mouvement: any) => ({
          date: mouvement.date,
          libelle: mouvement.libelle,
          debit: parseFloat(mouvement.debit) || 0,
          credit: parseFloat(mouvement.credit) || 0
        }))
      } : undefined
    });

    // Créer les écritures comptables si fournies
    if (ecrituresComptables && ecrituresComptables.length > 0) {
      const { prisma } = await import('@/lib/prisma');
      
      // Récupérer le plan comptable du client
      const client = await prisma.client.findUnique({
        where: { uid: clientUid },
        include: {
          comptable: {
            include: { planComptable: true }
          }
        }
      });

      if (client?.comptable?.planComptable) {
        const planComptable = client.comptable.planComptable;

        // Créer les écritures comptables
        for (const ecriture of ecrituresComptables) {
          const compte = planComptable.find(c => c.num_compte === ecriture.num_compte);
          
          if (compte) {
            await prisma.ecritureComptable.create({
              data: {
                journalBanqueId: journal.id,
                planId: compte.id,
                debit: parseFloat(ecriture.debit) || 0,
                credit: parseFloat(ecriture.credit) || 0,
                libelle: ecriture.libelle || compte.libelle,
                num_compte: ecriture.num_compte,
                date: new Date(extractedData.date ?? new Date())
              }
            });
          }
        }

        // Mettre à jour le statut du journal à VALIDATED après création des écritures
        await prisma.journalBanque.update({
          where: { id: journal.id },
          data: { status: 'COMPTABILISE' }
        });

        // Mettre à jour l'objet journal retourné
        journal.status = 'COMPTABILISE';
      }
    }

    return journal;
  },

  /**
   * Met à jour un journal (générique)
   */
  async updateJournal(type: JournalType, id: string, fields: any) {
    const parsed = parseNumericFields(fields, FACTURE_NUMERIC_FIELDS);
    
    switch (type) {
      case 'achat':
        return journalAchatRepository.update(id, parsed);
      case 'vente':
        return journalVenteRepository.update(id, parsed);
      case 'banque':
        // Gestion spéciale des mouvements pour banque
        const updateData: any = { ...parsed };
        if (fields.mouvements) {
          updateData.mouvements = {
            deleteMany: {},
            create: fields.mouvements.map((mouvement: any) => ({
              date: mouvement.date,
              libelle: mouvement.libelle,
              debit: parseFloat(mouvement.debit) || 0,
              credit: parseFloat(mouvement.credit) || 0
            }))
          };
        }
        return journalBanqueRepository.update(id, updateData);
    }
  },

  /**
   * Supprime un journal
   */
  async deleteJournal(type: JournalType, id: string) {
    switch (type) {
      case 'achat':
        return journalAchatRepository.delete(id);
      case 'vente':
        return journalVenteRepository.delete(id);
      case 'banque':
        return journalBanqueRepository.delete(id);
    }
  },

  /**
   * Récupère les journaux avec filtres
   */
  async getJournals(type: JournalType, filters: any) {
    switch (type) {
      case 'achat':
        return journalAchatRepository.findMany(filters);
      case 'vente':
        return journalVenteRepository.findMany(filters);
      case 'banque':
        return journalBanqueRepository.findMany(filters);
    }
  }
};
