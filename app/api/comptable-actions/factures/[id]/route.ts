import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Utilitaire pour gérer BigInt dans JSON
function bigIntReplacer(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

function JsonResponse(data: any, status: number = 200) {
  const serializedBody = JSON.stringify(data, bigIntReplacer);
  
  return new NextResponse(serializedBody, {
    status: status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// PUT - Modifier une facture
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const comptable = await prisma.comptable.findUnique({
      where: { userId: session.user.id }
    });

    if (!comptable) {
      return NextResponse.json({ error: 'Comptable non trouvé' }, { status: 404 });
    }

    // Vérifier que la facture appartient à un client du comptable
    const facture = await prisma.journalAchat.findFirst({
      where: {
        id: params.id,
        client: {
          comptableId: comptable.id
        }
      }
    });

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée ou non autorisée' }, { status: 404 });
    }

    const data = await request.json();
    const { id, ecrituresComptables, ...fields } = data;

    // Conversion des montants en Float si nécessaire
    const parseToFloat = (value: any) => {
      if (typeof value === 'string' || typeof value === 'number') {
        return parseFloat(value.toString()) || 0;
      }
      return value;
    };

    const updateData: any = {};
    
    // Traiter les champs numériques
    const numericFields = ['total_ht', 'total_ttc', 'total_tva', 'tva_7', 'tva_13', 'tva_19', 'remise', 'timbre_fiscal'];
    
    // Champs valides pour JournalAchat (exclure clientdefacture qui est pour JournalVente)
    const validFields = ['fournisseur', 'date', 'reference', 'type_facture', 'status', ...numericFields];
    
    Object.keys(fields).forEach(key => {
      // Ignorer les champs qui n'existent pas dans JournalAchat
      if (!validFields.includes(key)) {
        return;
      }
      
      if (numericFields.includes(key)) {
        updateData[key] = parseToFloat(fields[key]);
      } else {
        updateData[key] = fields[key];
      }
    });

    // Transaction pour mettre à jour la facture et les écritures
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour la facture
      const updatedFacture = await tx.journalAchat.update({
        where: { id: params.id },
        data: updateData,
        include: {
          client: {
            select: {
              uid: true,
              nom: true,
              societe: true,
              email: true
            }
          }
        }
      });

      // 2. Si des écritures sont fournies, les mettre à jour
      if (ecrituresComptables && ecrituresComptables.length > 0) {
        // Supprimer les anciennes écritures
        await tx.ecritureComptable.deleteMany({
          where: { factureId: params.id }
        });

        // Récupérer le plan comptable
        const planComptable = await tx.planComptable.findMany({
          where: { comptableId: comptable.id }
        });

        // Créer les nouvelles écritures
        for (const ecriture of ecrituresComptables) {
          const numCompte = ecriture.num_compte || ecriture.compte;
          const compteExiste = planComptable.find(c => c.num_compte === numCompte);
          
          if (compteExiste) {
            await tx.ecritureComptable.create({
              data: {
                factureId: params.id,
                planId: compteExiste.id,
                libelle: ecriture.libelle || compteExiste.libelle,
                num_compte: compteExiste.num_compte,
                debit: parseFloat(String(ecriture.debit)) || 0,
                credit: parseFloat(String(ecriture.credit)) || 0,
                date: new Date(updateData.date || facture.date)
              }
            });
          }
        }

        // Mettre à jour le statut et les métadonnées
        const totalDebit = ecrituresComptables.reduce((sum: number, e: any) => sum + (parseFloat(String(e.debit)) || 0), 0);
        const totalCredit = ecrituresComptables.reduce((sum: number, e: any) => sum + (parseFloat(String(e.credit)) || 0), 0);

        await tx.journalAchat.update({
          where: { id: params.id },
          data: {
            status: 'COMPTABILISE',
            accounting_entries: {
              updated_at: new Date().toISOString(),
              entries_count: ecrituresComptables.length,
              total_debit: totalDebit,
              total_credit: totalCredit
            }
          }
        });
      }

      return updatedFacture;
    });

    return JsonResponse(result);
  } catch (error: any) {
    console.error('Erreur PUT facture:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification de la facture' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une facture
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const comptable = await prisma.comptable.findUnique({
      where: { userId: session.user.id }
    });

    if (!comptable) {
      return NextResponse.json({ error: 'Comptable non trouvé' }, { status: 404 });
    }

    // Vérifier que la facture appartient à un client du comptable
    const facture = await prisma.journalAchat.findFirst({
      where: {
        id: params.id,
        client: {
          comptableId: comptable.id
        }
      }
    });

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée ou non autorisée' }, { status: 404 });
    }

    // Supprimer d'abord toutes les écritures comptables liées à cette facture
    await prisma.ecritureComptable.deleteMany({
      where: { factureId: params.id }
    });

    // Ensuite supprimer la facture
    await prisma.journalAchat.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Facture supprimée avec succès (y compris toutes les écritures comptables associées)` 
    });
  } catch (error: any) {
    console.error('Erreur DELETE facture:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression de la facture' },
      { status: 500 }
    );
  }
}