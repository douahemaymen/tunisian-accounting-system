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

// DELETE - Supprimer un journal vente
export const dynamic = 'force-dynamic';

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

    // Vérifier que le journal vente appartient à un client du comptable
    const journalVente = await prisma.journalVente.findFirst({
      where: {
        id: params.id,
        client: {
          comptableId: comptable.id
        }
      }
    });

    if (!journalVente) {
      return NextResponse.json({ error: 'Journal vente non trouvé ou non autorisé' }, { status: 404 });
    }

    // Supprimer d'abord toutes les écritures comptables liées à ce journal
    await prisma.ecritureComptable.deleteMany({
      where: { factureId: params.id }
    });

    // Ensuite supprimer le journal vente
    await prisma.journalVente.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Journal vente supprimé avec succès (y compris toutes les écritures comptables associées)` 
    });
  } catch (error: any) {
    console.error('Erreur DELETE journal vente:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du journal vente' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un journal vente
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

    // Vérifier que le journal vente appartient à un client du comptable
    const journalVente = await prisma.journalVente.findFirst({
      where: {
        id: params.id,
        client: {
          comptableId: comptable.id
        }
      }
    });

    if (!journalVente) {
      return NextResponse.json({ error: 'Journal vente non trouvé ou non autorisé' }, { status: 404 });
    }

    const data = await request.json();
    const { id, ...fields } = data;

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
    
    Object.keys(fields).forEach(key => {
      if (numericFields.includes(key)) {
        updateData[key] = parseToFloat(fields[key]);
      } else {
        updateData[key] = fields[key];
      }
    });

    const updatedJournal = await prisma.journalVente.update({
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

    return JsonResponse(updatedJournal);
  } catch (error: any) {
    console.error('Erreur PUT journal vente:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification du journal vente' },
      { status: 500 }
    );
  }
}
