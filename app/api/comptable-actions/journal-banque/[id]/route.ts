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

// DELETE - Supprimer un journal banque
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

    // Vérifier que le journal banque appartient à un client du comptable
    const journalBanque = await prisma.journalBanque.findFirst({
      where: {
        id: params.id,
        client: {
          comptableId: comptable.id
        }
      }
    });

    if (!journalBanque) {
      return NextResponse.json({ error: 'Journal banque non trouvé ou non autorisé' }, { status: 404 });
    }

    // Supprimer d'abord toutes les écritures comptables liées à ce journal
    await prisma.ecritureComptable.deleteMany({
      where: { journalBanqueId: params.id }
    });

    // Supprimer tous les mouvements du journal
    await prisma.mouvementJournal.deleteMany({
      where: { journalBanqueId: params.id }
    });

    // Ensuite supprimer le journal banque
    await prisma.journalBanque.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Journal banque supprimé avec succès (y compris tous les mouvements et écritures comptables associés)` 
    });
  } catch (error: any) {
    console.error('Erreur DELETE journal banque:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du journal banque' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un journal banque
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

    // Vérifier que le journal banque appartient à un client du comptable
    const journalBanque = await prisma.journalBanque.findFirst({
      where: {
        id: params.id,
        client: {
          comptableId: comptable.id
        }
      }
    });

    if (!journalBanque) {
      return NextResponse.json({ error: 'Journal banque non trouvé ou non autorisé' }, { status: 404 });
    }

    const data = await request.json();
    const { id, ...fields } = data;

    const updatedJournal = await prisma.journalBanque.update({
      where: { id: params.id },
      data: fields,
      include: {
        client: {
          select: {
            uid: true,
            nom: true,
            societe: true,
            email: true
          }
        },
        mouvements: true,
        ecritures: true
      }
    });

    return JsonResponse(updatedJournal);
  } catch (error: any) {
    console.error('Erreur PUT journal banque:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la modification du journal banque' },
      { status: 500 }
    );
  }
}
