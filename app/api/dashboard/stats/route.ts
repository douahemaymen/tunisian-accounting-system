import { NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const comptable = await authService.getComptable();

    // Récupérer tous les clients du comptable
    const clients = await prisma.client.findMany({
      where: { comptableId: comptable.id },
      select: {
        uid: true,
        nom: true,
        societe: true,
        journauxAchat: {
          select: {
            id: true,
            total_ttc: true,
            total_tva: true,
            total_ht: true,
            date: true,
            status: true
          }
        },
        journauxVente: {
          select: {
            id: true,
            total_ttc: true,
            total_tva: true,
            total_ht: true,
            date: true,
            status: true
          }
        },
        journauxBanque: {
          select: {
            id: true,
            date: true,
            status: true,
            mouvements: {
              select: {
                debit: true,
                credit: true
              }
            }
          }
        }
      }
    });

    // Calculer les statistiques globales
    let totalFactures = 0;
    let totalTTC = 0;
    let totalTVA = 0;
    let totalHT = 0;
    let totalAchats = 0;
    let totalVentes = 0;

    // Statistiques par client
    const clientsStats = clients.map(client => {
      const nbAchats = client.journauxAchat.length;
      const nbVentes = client.journauxVente.length;
      const nbBanque = client.journauxBanque.length;
      
      const totalAchatsClient = client.journauxAchat.reduce((sum, j) => sum + j.total_ttc, 0);
      const totalVentesClient = client.journauxVente.reduce((sum, j) => sum + j.total_ttc, 0);
      
      totalFactures += nbAchats + nbVentes + nbBanque;
      totalTTC += totalAchatsClient + totalVentesClient;
      totalTVA += client.journauxAchat.reduce((sum, j) => sum + j.total_tva, 0) +
                  client.journauxVente.reduce((sum, j) => sum + j.total_tva, 0);
      totalHT += client.journauxAchat.reduce((sum, j) => sum + j.total_ht, 0) +
                 client.journauxVente.reduce((sum, j) => sum + j.total_ht, 0);
      
      totalAchats += totalAchatsClient;
      totalVentes += totalVentesClient;

      return {
        uid: client.uid,
        nom: client.nom,
        societe: client.societe,
        nombreFactures: nbAchats + nbVentes + nbBanque,
        nombreAchats: nbAchats,
        nombreVentes: nbVentes,
        nombreBanque: nbBanque,
        totalAchats: totalAchatsClient,
        totalVentes: totalVentesClient,
        solde: totalVentesClient - totalAchatsClient
      };
    });

    // Factures par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const facturesParMois: { [key: string]: { achats: number; ventes: number; count: number } } = {};
    
    clients.forEach(client => {
      client.journauxAchat.forEach(facture => {
        const date = new Date(facture.date);
        if (date >= sixMonthsAgo) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!facturesParMois[monthKey]) {
            facturesParMois[monthKey] = { achats: 0, ventes: 0, count: 0 };
          }
          facturesParMois[monthKey].achats += facture.total_ttc;
          facturesParMois[monthKey].count += 1;
        }
      });

      client.journauxVente.forEach(facture => {
        const date = new Date(facture.date);
        if (date >= sixMonthsAgo) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!facturesParMois[monthKey]) {
            facturesParMois[monthKey] = { achats: 0, ventes: 0, count: 0 };
          }
          facturesParMois[monthKey].ventes += facture.total_ttc;
          facturesParMois[monthKey].count += 1;
        }
      });
    });

    // Convertir en tableau trié
    const facturesParMoisArray = Object.entries(facturesParMois)
      .map(([month, data]) => ({
        month,
        achats: data.achats,
        ventes: data.ventes,
        total: data.achats + data.ventes,
        count: data.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const stats = {
      totalFactures,
      totalTTC,
      totalTVA,
      totalHT,
      totalAchats,
      totalVentes,
      soldeClient: totalVentes - totalAchats,
      nombreClients: clients.length,
      clientsStats: clientsStats.sort((a, b) => b.nombreFactures - a.nombreFactures),
      facturesParMois: facturesParMoisArray
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des stats:', error);
    
    if (error.message === 'Non autorisé') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
