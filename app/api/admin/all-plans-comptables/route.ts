import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllPlansComptables, getPlansComptablesStats } from '@/lib/plan-comptable';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Vérifier l'authentification et les permissions admin
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';
    const comptableId = searchParams.get('comptableId');

    // Récupérer les plans comptables
    const plansComptables = await getAllPlansComptables(comptableId || undefined);

    // Préparer la réponse
    const response: any = {
      plansComptables,
      total: plansComptables.length
    };

    // Ajouter les statistiques si demandées
    if (includeStats) {
      const stats = await getPlansComptablesStats();
      response.stats = stats;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur récupération tous les plans comptables:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des plans comptables' },
      { status: 500 }
    );
  }
}