// Service pour la gestion du plan comptable
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const planComptableService = {
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
   * Crée un nouveau compte
   */
  async createCompte(comptableId: string, data: {
    num_compte: string;
    libelle: string;
    type_compte?: string;
  }) {
    // Vérifier si le compte existe déjà
    const existing = await prisma.planComptable.findFirst({
      where: {
        comptableId,
        num_compte: data.num_compte
      }
    });

    if (existing) {
      throw new Error('Ce numéro de compte existe déjà');
    }

    return prisma.planComptable.create({
      data: {
        comptableId,
        ...data
      }
    });
  },

  /**
   * Met à jour un compte
   */
  async updateCompte(id: string, data: {
    num_compte?: string;
    libelle?: string;
    type_compte?: string;
  }) {
    return prisma.planComptable.update({
      where: { id },
      data
    });
  },

  /**
   * Supprime un compte
   */
  async deleteCompte(id: string) {
    // Vérifier si le compte est utilisé dans des écritures
    const ecrituresCount = await prisma.ecritureComptable.count({
      where: { planId: id }
    });

    if (ecrituresCount > 0) {
      throw new Error(`Ce compte est utilisé dans ${ecrituresCount} écriture(s) et ne peut pas être supprimé`);
    }

    return prisma.planComptable.delete({
      where: { id }
    });
  },

  /**
   * Initialise le plan comptable avec les comptes standards tunisiens
   */
  async initPlanComptable(comptableId: string) {
    const comptesStandards = [
      // Classe 1 - Capitaux
      { num_compte: '1010000', libelle: 'Capital social', type_compte: 'Capitaux propres' },
      { num_compte: '1060000', libelle: 'Réserves', type_compte: 'Capitaux propres' },
      { num_compte: '1200000', libelle: 'Résultat de l\'exercice', type_compte: 'Capitaux propres' },
      
      // Classe 2 - Immobilisations
      { num_compte: '2110000', libelle: 'Terrains', type_compte: 'Actif' },
      { num_compte: '2130000', libelle: 'Constructions', type_compte: 'Actif' },
      { num_compte: '2180000', libelle: 'Matériel de transport', type_compte: 'Actif' },
      { num_compte: '2183000', libelle: 'Matériel de bureau et informatique', type_compte: 'Actif' },
      { num_compte: '2810000', libelle: 'Amortissements des immobilisations', type_compte: 'Actif' },
      
      // Classe 3 - Stocks
      { num_compte: '3100000', libelle: 'Matières premières', type_compte: 'Actif' },
      { num_compte: '3200000', libelle: 'Autres approvisionnements', type_compte: 'Actif' },
      { num_compte: '3500000', libelle: 'Produits finis', type_compte: 'Actif' },
      
      // Classe 4 - Tiers
      { num_compte: '4010000', libelle: 'Fournisseurs', type_compte: 'Passif' },
      { num_compte: '4110000', libelle: 'Clients', type_compte: 'Actif' },
      { num_compte: '4210000', libelle: 'Personnel - Rémunérations dues', type_compte: 'Passif' },
      { num_compte: '4310000', libelle: 'Sécurité sociale', type_compte: 'Passif' },
      { num_compte: '4420000', libelle: 'État - Impôts et taxes', type_compte: 'Passif' },
      { num_compte: '4455000', libelle: 'TVA déductible', type_compte: 'Actif' },
      { num_compte: '4457000', libelle: 'TVA collectée', type_compte: 'Passif' },
      { num_compte: '4458000', libelle: 'TVA à payer', type_compte: 'Passif' },
      
      // Classe 5 - Financiers
      { num_compte: '5120000', libelle: 'Banques', type_compte: 'Actif' },
      { num_compte: '5300000', libelle: 'Caisse', type_compte: 'Actif' },
      { num_compte: '5400000', libelle: 'Régies d\'avances', type_compte: 'Actif' },
      
      // Classe 6 - Charges
      { num_compte: '6010000', libelle: 'Achats de marchandises', type_compte: 'Charge' },
      { num_compte: '6020000', libelle: 'Achats de matières premières', type_compte: 'Charge' },
      { num_compte: '6110000', libelle: 'Sous-traitance générale', type_compte: 'Charge' },
      { num_compte: '6120000', libelle: 'Redevances de crédit-bail', type_compte: 'Charge' },
      { num_compte: '6130000', libelle: 'Locations', type_compte: 'Charge' },
      { num_compte: '6140000', libelle: 'Charges locatives et de copropriété', type_compte: 'Charge' },
      { num_compte: '6150000', libelle: 'Entretien et réparations', type_compte: 'Charge' },
      { num_compte: '6180000', libelle: 'Documentation générale', type_compte: 'Charge' },
      { num_compte: '6220000', libelle: 'Rémunérations du personnel', type_compte: 'Charge' },
      { num_compte: '6260000', libelle: 'Charges sociales', type_compte: 'Charge' },
      { num_compte: '6270000', libelle: 'Autres charges de personnel', type_compte: 'Charge' },
      { num_compte: '6310000', libelle: 'Impôts et taxes', type_compte: 'Charge' },
      { num_compte: '6360000', libelle: 'Droits d\'enregistrement', type_compte: 'Charge' },
      { num_compte: '6410000', libelle: 'Charges financières', type_compte: 'Charge' },
      { num_compte: '6810000', libelle: 'Dotations aux amortissements', type_compte: 'Charge' },
      
      // Classe 7 - Produits
      { num_compte: '7010000', libelle: 'Ventes de marchandises', type_compte: 'Produit' },
      { num_compte: '7020000', libelle: 'Ventes de produits finis', type_compte: 'Produit' },
      { num_compte: '7060000', libelle: 'Prestations de services', type_compte: 'Produit' },
      { num_compte: '7080000', libelle: 'Produits des activités annexes', type_compte: 'Produit' },
      { num_compte: '7410000', libelle: 'Produits financiers', type_compte: 'Produit' },
      { num_compte: '7580000', libelle: 'Produits divers', type_compte: 'Produit' }
    ];

    // Créer tous les comptes en transaction
    const created = await prisma.$transaction(
      comptesStandards.map(compte =>
        prisma.planComptable.create({
          data: {
            comptableId,
            ...compte
          }
        })
      )
    );

    return {
      comptesCreated: created.length,
      comptes: created
    };
  },

  /**
   * Importe un plan comptable depuis un fichier JSON
   */
  async importFromJSON(comptableId: string, comptes: any[]) {
    const created = await prisma.$transaction(
      comptes.map(compte =>
        prisma.planComptable.create({
          data: {
            comptableId,
            num_compte: compte.num_compte,
            libelle: compte.libelle,
            type_compte: compte.type_compte || null
          }
        })
      )
    );

    return {
      comptesCreated: created.length,
      comptes: created
    };
  },

  /**
   * Exporte le plan comptable
   */
  async exportPlanComptable(comptableId: string) {
    const comptes = await this.getPlanComptable(comptableId);
    
    return comptes.map(compte => ({
      num_compte: compte.num_compte,
      libelle: compte.libelle,
      type_compte: compte.type_compte
    }));
  },

  /**
   * Recherche dans le plan comptable
   */
  async searchComptes(comptableId: string, searchTerm: string) {
    return prisma.planComptable.findMany({
      where: {
        comptableId,
        OR: [
          { num_compte: { contains: searchTerm } },
          { libelle: { contains: searchTerm, mode: 'insensitive' } },
          { type_compte: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      orderBy: { num_compte: 'asc' }
    });
  }
};
