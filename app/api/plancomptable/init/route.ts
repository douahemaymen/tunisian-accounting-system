import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Plan comptable standard tunisien
const PLAN_COMPTABLE_STANDARD = [
  // Classe 1 - Comptes de financement permanent
  { num_compte: '101000', libelle: 'Capital social', type_compte: 'Capitaux propres' },
  { num_compte: '106000', libelle: 'Réserves', type_compte: 'Capitaux propres' },
  { num_compte: '120000', libelle: 'Résultat de l\'exercice', type_compte: 'Capitaux propres' },
  { num_compte: '161000', libelle: 'Emprunts obligataires', type_compte: 'Passif' },
  { num_compte: '162000', libelle: 'Emprunts et dettes auprès des établissements de crédit', type_compte: 'Passif' },

  // Classe 2 - Comptes d'immobilisations
  { num_compte: '211000', libelle: 'Terrains', type_compte: 'Actif' },
  { num_compte: '213000', libelle: 'Constructions', type_compte: 'Actif' },
  { num_compte: '218000', libelle: 'Autres immobilisations corporelles', type_compte: 'Actif' },
  { num_compte: '221000', libelle: 'Immobilisations incorporelles', type_compte: 'Actif' },
  { num_compte: '281300', libelle: 'Amortissements des constructions', type_compte: 'Actif' },
  { num_compte: '281800', libelle: 'Amortissements des autres immobilisations corporelles', type_compte: 'Actif' },

  // Classe 3 - Comptes de stocks
  { num_compte: '300000', libelle: 'Marchandises', type_compte: 'Actif' },
  { num_compte: '320000', libelle: 'Matières premières', type_compte: 'Actif' },
  { num_compte: '330000', libelle: 'Autres approvisionnements', type_compte: 'Actif' },
  { num_compte: '350000', libelle: 'Produits finis', type_compte: 'Actif' },

  // Classe 4 - Comptes de tiers
  { num_compte: '401000', libelle: 'Fournisseurs', type_compte: 'Passif' },
  { num_compte: '408000', libelle: 'Fournisseurs - factures non parvenues', type_compte: 'Passif' },
  { num_compte: '409000', libelle: 'Fournisseurs débiteurs', type_compte: 'Actif' },
  { num_compte: '411000', libelle: 'Clients', type_compte: 'Actif' },
  { num_compte: '418000', libelle: 'Clients - produits non encore facturés', type_compte: 'Actif' },
  { num_compte: '419000', libelle: 'Clients créditeurs', type_compte: 'Passif' },
  { num_compte: '421000', libelle: 'Personnel - rémunérations dues', type_compte: 'Passif' },
  { num_compte: '422000', libelle: 'Comités du personnel, d\'entreprise et d\'établissement', type_compte: 'Passif' },
  { num_compte: '431000', libelle: 'Sécurité sociale', type_compte: 'Passif' },
  { num_compte: '437000', libelle: 'Autres organismes sociaux', type_compte: 'Passif' },
  { num_compte: '441000', libelle: 'État - subventions à recevoir', type_compte: 'Actif' },
  { num_compte: '442000', libelle: 'État - impôts et taxes recouvrables sur des tiers', type_compte: 'Actif' },
  { num_compte: '445500', libelle: 'État - TVA à décaisser', type_compte: 'Passif' },
  { num_compte: '445600', libelle: 'État - TVA déductible', type_compte: 'Actif' },
  { num_compte: '445700', libelle: 'État - TVA collectée', type_compte: 'Passif' },
  { num_compte: '447000', libelle: 'État - autres impôts, taxes et versements assimilés', type_compte: 'Passif' },
  { num_compte: '448000', libelle: 'État - charges à payer et produits à recevoir', type_compte: 'Passif' },

  // Classe 5 - Comptes financiers
  { num_compte: '512000', libelle: 'Banques', type_compte: 'Actif' },
  { num_compte: '531000', libelle: 'Caisse', type_compte: 'Actif' },
  { num_compte: '532000', libelle: 'Régie d\'avances et accréditifs', type_compte: 'Actif' },

  // Classe 6 - Comptes de charges
  { num_compte: '601000', libelle: 'Achats de marchandises', type_compte: 'Charge' },
  { num_compte: '602000', libelle: 'Achats de matières premières', type_compte: 'Charge' },
  { num_compte: '606000', libelle: 'Achats non stockés de matières et fournitures', type_compte: 'Charge' },
  { num_compte: '607000', libelle: 'Achats de marchandises, matières premières et autres approvisionnements', type_compte: 'Charge' },
  { num_compte: '608000', libelle: 'Frais accessoires d\'achats', type_compte: 'Charge' },
  { num_compte: '609000', libelle: 'Rabais, remises et ristournes obtenus sur achats', type_compte: 'Charge' },
  { num_compte: '611000', libelle: 'Sous-traitance générale', type_compte: 'Charge' },
  { num_compte: '613000', libelle: 'Locations', type_compte: 'Charge' },
  { num_compte: '614000', libelle: 'Charges locatives et de copropriété', type_compte: 'Charge' },
  { num_compte: '615000', libelle: 'Entretien et réparations', type_compte: 'Charge' },
  { num_compte: '616000', libelle: 'Primes d\'assurances', type_compte: 'Charge' },
  { num_compte: '618000', libelle: 'Divers', type_compte: 'Charge' },
  { num_compte: '622000', libelle: 'Rémunérations d\'intermédiaires et honoraires', type_compte: 'Charge' },
  { num_compte: '623000', libelle: 'Publicité, publications, relations publiques', type_compte: 'Charge' },
  { num_compte: '624000', libelle: 'Transports de biens et transports collectifs du personnel', type_compte: 'Charge' },
  { num_compte: '625000', libelle: 'Déplacements, missions et réceptions', type_compte: 'Charge' },
  { num_compte: '626000', libelle: 'Frais postaux et de télécommunications', type_compte: 'Charge' },
  { num_compte: '627000', libelle: 'Services bancaires et assimilés', type_compte: 'Charge' },
  { num_compte: '628000', libelle: 'Divers', type_compte: 'Charge' },
  { num_compte: '641000', libelle: 'Rémunérations du personnel', type_compte: 'Charge' },
  { num_compte: '644000', libelle: 'Rémunération du travail de l\'exploitant', type_compte: 'Charge' },
  { num_compte: '645000', libelle: 'Charges de sécurité sociale et de prévoyance', type_compte: 'Charge' },
  { num_compte: '646000', libelle: 'Cotisations sociales personnelles de l\'exploitant', type_compte: 'Charge' },
  { num_compte: '647000', libelle: 'Autres charges sociales', type_compte: 'Charge' },
  { num_compte: '681000', libelle: 'Dotations aux amortissements et aux provisions', type_compte: 'Charge' },
  { num_compte: '686000', libelle: 'Dotations aux provisions pour dépréciation', type_compte: 'Charge' },

  // Classe 7 - Comptes de produits
  { num_compte: '701000', libelle: 'Ventes de marchandises', type_compte: 'Produit' },
  { num_compte: '706000', libelle: 'Prestations de services', type_compte: 'Produit' },
  { num_compte: '707000', libelle: 'Ventes de marchandises et production vendue', type_compte: 'Produit' },
  { num_compte: '708000', libelle: 'Produits des activités annexes', type_compte: 'Produit' },
  { num_compte: '709000', libelle: 'Rabais, remises et ristournes accordés par l\'entreprise', type_compte: 'Produit' },
  { num_compte: '781000', libelle: 'Reprises sur amortissements et provisions', type_compte: 'Produit' },
  { num_compte: '786000', libelle: 'Reprises sur provisions pour dépréciation', type_compte: 'Produit' },
];

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session.user.role !== 'comptable') {
      return NextResponse.json({ error: 'Seuls les comptables peuvent initialiser un plan comptable' }, { status: 403 });
    }

    const comptable = await prisma.comptable.findUnique({
      where: { userId: session.user.id }
    });

    if (!comptable) {
      return NextResponse.json({ error: 'Comptable non trouvé' }, { status: 404 });
    }

    // Vérifier si le plan comptable existe déjà
    const existingComptes = await prisma.planComptable.count({
      where: { comptableId: comptable.id }
    });

    if (existingComptes > 0) {
      return NextResponse.json(
        { error: 'Un plan comptable existe déjà. Supprimez-le d\'abord si vous voulez le réinitialiser.' },
        { status: 400 }
      );
    }

    // Créer tous les comptes en une seule transaction
    const comptesCreated = await prisma.$transaction(
      PLAN_COMPTABLE_STANDARD.map(compte =>
        prisma.planComptable.create({
          data: {
            comptableId: comptable.id,
            num_compte: compte.num_compte,
            libelle: compte.libelle,
            type_compte: compte.type_compte
          }
        })
      )
    );

    return NextResponse.json({
      message: 'Plan comptable initialisé avec succès',
      comptesCreated: comptesCreated.length
    });

  } catch (error) {
    console.error('Erreur initialisation plan comptable:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}