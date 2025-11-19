import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeJournal = searchParams.get('typeJournal');
    const client = searchParams.get('client');
    const yearMonth = searchParams.get('yearMonth');
    const search = searchParams.get('search');

    // Récupérer le comptable
    let comptableId: string;
    
    if (session.user.role === 'comptable') {
      const comptable = await prisma.comptable.findUnique({
        where: { userId: session.user.id }
      });

      if (!comptable) {
        return NextResponse.json({ error: 'Comptable non trouvé' }, { status: 404 });
      }

      comptableId = comptable.id;
    } else {
      return NextResponse.json({ error: 'Accès réservé aux comptables' }, { status: 403 });
    }

    // Construire les filtres
    const whereClause: any = {
      facture: {
        client: {
          comptableId: comptableId
        }
      }
    };

    // Filtres additionnels
    if (typeJournal) {
      whereClause.facture.type_facture = typeJournal;
    }

    if (client && client !== 'ALL') {
      whereClause.facture.client.nom = client;
    }

    if (yearMonth) {
      const [year, month] = yearMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      whereClause.facture.date = {
        gte: startDate.toISOString(),
        lte: endDate.toISOString()
      };
    }

    // Récupérer les écritures
    const ecritures = await prisma.ecritureComptable.findMany({
      where: whereClause,
      include: {
        facture: {
          include: {
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
      },
      orderBy: [
        { facture: { date: 'desc' } },
        { planComptable: { num_compte: 'asc' } }
      ]
    });

    // Filtrer par recherche textuelle si nécessaire
    const filteredEcritures = search ? ecritures.filter(ecriture => {
      const searchLower = search.toLowerCase();
      return (
        ecriture.facture.reference.toLowerCase().includes(searchLower) ||
        ecriture.facture.client.nom.toLowerCase().includes(searchLower) ||
        ecriture.planComptable.num_compte.includes(search) ||
        ecriture.planComptable.libelle.toLowerCase().includes(searchLower)
      );
    }) : ecritures;

    // Générer le CSV
    const csvHeaders = [
      'Date',
      'Référence Facture',
      'Type Journal',
      'Client',
      'Société',
      'Numéro Compte',
      'Libellé Compte',
      'Type Compte',
      'Débit',
      'Crédit',
      'Fournisseur'
    ];

    const csvRows = filteredEcritures.map(ecriture => [
      new Date(ecriture.date).toLocaleDateString('fr-FR'),
      ecriture.facture.reference,
      ecriture.facture.type_facture,
      ecriture.facture.client.nom,
      ecriture.facture.client.societe,
      ecriture.planComptable.num_compte,
      ecriture.planComptable.libelle,
      ecriture.planComptable.type_compte || '',
      ecriture.debit.toFixed(3),
      ecriture.credit.toFixed(3),
      ecriture.facture.fournisseur
    ]);

    // Ajouter les totaux
    const totalDebit = filteredEcritures.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = filteredEcritures.reduce((sum, e) => sum + e.credit, 0);
    
    csvRows.push([]);
    csvRows.push(['TOTAUX', '', '', '', '', '', '', '', totalDebit.toFixed(3), totalCredit.toFixed(3), '']);
    csvRows.push(['SOLDE', '', '', '', '', '', '', '', (totalDebit - totalCredit).toFixed(3), '', '']);

    // Construire le CSV
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Retourner le fichier CSV
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ecritures-comptables-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'export:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'export des écritures',
        details: error.message
      },
      { status: 500 }
    );
  }
}