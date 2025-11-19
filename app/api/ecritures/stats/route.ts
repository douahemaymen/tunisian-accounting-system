import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

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
    } else if (session.user.role === 'admin') {
      // Pour les admins, on peut ajouter un paramètre comptableId plus tard
      return NextResponse.json({ error: 'Fonctionnalité admin en développement' }, { status: 403 });
    } else {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer toutes les écritures du comptable avec les factures
    const ecritures = await prisma.ecritureComptable.findMany({
      where: {
        facture: {
          client: {
            comptableId: comptableId
          }
        }
      },
      include: {
        facture: {
          select: {
            id: true,
            reference: true,
            type_facture: true,
            fournisseur: true,
            total_ttc: true,
            created_at: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculer les statistiques
    const totalEcritures = ecritures.length;
    
    // Simuler les méthodes de génération (à améliorer avec de vraies données)
    // Pour l'instant, on simule basé sur des patterns
    const methodStats = {
      GEMINI_AI: { count: 0, totalTime: 0, successes: 0 },
      STATIC_RULES: { count: 0, totalTime: 0, successes: 0 },
      HYBRID: { count: 0, totalTime: 0, successes: 0 }
    };

    // Grouper les écritures par facture pour analyser l'équilibre
    const factureGroups = ecritures.reduce((acc, ecriture) => {
      const factureId = ecriture.factureId;
      if (!acc[factureId]) {
        acc[factureId] = {
          facture: { id: factureId },
          ecritures: [],
          totalDebit: 0,
          totalCredit: 0
        };
      }
      acc[factureId].ecritures.push(ecriture);
      acc[factureId].totalDebit += ecriture.debit;
      acc[factureId].totalCredit += ecriture.credit;
      return acc;
    }, {} as Record<string, any>);

    // Calculer le taux d'équilibre
    const factureIds = Object.keys(factureGroups);
    const equilibrees = factureIds.filter(id => {
      const group = factureGroups[id];
      return Math.abs(group.totalDebit - group.totalCredit) < 0.01;
    });
    
    const equilibreRate = factureIds.length > 0 ? (equilibrees.length / factureIds.length) * 100 : 100;

    // Simuler les données de méthode (à remplacer par de vraies données)
    const totalFactures = factureIds.length;
    if (totalFactures > 0) {
      // Simulation basée sur des patterns réalistes
      methodStats.GEMINI_AI.count = Math.floor(totalFactures * 0.7); // 70% Gemini
      methodStats.STATIC_RULES.count = Math.floor(totalFactures * 0.25); // 25% Static
      methodStats.HYBRID.count = totalFactures - methodStats.GEMINI_AI.count - methodStats.STATIC_RULES.count;

      // Temps simulés
      methodStats.GEMINI_AI.totalTime = methodStats.GEMINI_AI.count * (2000 + Math.random() * 3000);
      methodStats.STATIC_RULES.totalTime = methodStats.STATIC_RULES.count * (50 + Math.random() * 100);
      methodStats.HYBRID.totalTime = methodStats.HYBRID.count * (1000 + Math.random() * 2000);

      // Taux de succès simulés
      methodStats.GEMINI_AI.successes = Math.floor(methodStats.GEMINI_AI.count * 0.95);
      methodStats.STATIC_RULES.successes = methodStats.STATIC_RULES.count; // 100% pour static
      methodStats.HYBRID.successes = Math.floor(methodStats.HYBRID.count * 0.98);
    }

    // Calculer les moyennes
    const processedMethodStats = Object.entries(methodStats).reduce((acc, [method, stats]) => {
      acc[method] = {
        count: stats.count,
        avgTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
        successRate: stats.count > 0 ? (stats.successes / stats.count) * 100 : 100
      };
      return acc;
    }, {} as any);

    // Temps moyen global
    const totalTime = Object.values(methodStats).reduce((sum, stats) => sum + stats.totalTime, 0);
    const avgGenerationTime = totalFactures > 0 ? totalTime / totalFactures : 0;

    // Générations récentes (simulées à partir des factures récentes)
    const recentGenerations = factureIds.slice(0, 10).map(factureId => {
      const group = factureGroups[factureId];
      const methods = ['GEMINI_AI', 'STATIC_RULES', 'HYBRID'];
      const randomMethod = methods[Math.floor(Math.random() * methods.length)];
      
      return {
        id: factureId,
        method: randomMethod,
        time: randomMethod === 'GEMINI_AI' ? 2000 + Math.random() * 3000 :
              randomMethod === 'STATIC_RULES' ? 50 + Math.random() * 100 :
              1000 + Math.random() * 2000,
        success: Math.random() > 0.05, // 95% de succès
        factureRef: group.facture.reference,
        timestamp: new Date(Number(group.facture.created_at)).toISOString()
      };
    });

    const stats = {
      totalEcritures,
      methodStats: processedMethodStats,
      recentGenerations,
      equilibreRate,
      avgGenerationTime
    };

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('❌ Erreur lors du calcul des statistiques:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors du calcul des statistiques',
        details: error.message
      },
      { status: 500 }
    );
  }
}