'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ShoppingCart, Receipt, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FactureStats {
  totalFactures: number;
  facturesAchat: number;
  facturesVente: number;
  facturesBanque: number;
  facturesParMois: Array<{
    mois: string;
    achats: number;
    ventes: number;
    banque: number;
  }>;
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<FactureStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const clientUid = session?.user?.role === 'client' ? session.user.id : null;

  useEffect(() => {
    if (clientUid) {
      fetchFacturesStats();
    }
  }, [clientUid]);

  const fetchFacturesStats = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer toutes les factures
      const [resAchat, resVente, resBanque] = await Promise.all([
        fetch(`/api/journal-achat?clientUid=${clientUid}`),
        fetch(`/api/journal-vente?clientUid=${clientUid}`),
        fetch(`/api/journal-banque?clientUid=${clientUid}`)
      ]);

      const [achats, ventes, banques] = await Promise.all([
        resAchat.ok ? resAchat.json() : [],
        resVente.ok ? resVente.json() : [],
        resBanque.ok ? resBanque.json() : []
      ]);

      // Calculer les stats par mois
      const facturesParMois = calculateMonthlyStats(achats, ventes, banques);

      setStats({
        totalFactures: achats.length + ventes.length + banques.length,
        facturesAchat: achats.length,
        facturesVente: ventes.length,
        facturesBanque: banques.length,
        facturesParMois
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlyStats = (achats: any[], ventes: any[], banques: any[]) => {
    const monthsMap = new Map();
    const now = new Date();
    
    // Initialiser les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      monthsMap.set(key, { mois: label, achats: 0, ventes: 0, banque: 0 });
    }

    // Compter les factures par mois
    [...achats, ...ventes, ...banques].forEach((facture: any) => {
      const date = new Date(facture.date || facture.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthsMap.has(key)) {
        const stats = monthsMap.get(key);
        if (achats.includes(facture)) stats.achats++;
        else if (ventes.includes(facture)) stats.ventes++;
        else stats.banque++;
      }
    });

    return Array.from(monthsMap.values());
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1">Vue d'ensemble de vos documents</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFactures || 0}</div>
            <p className="text-xs text-slate-600 mt-1">Tous types confondus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures d'Achat</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.facturesAchat || 0}</div>
            <p className="text-xs text-slate-600 mt-1">Journal d'achat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures de Vente</CardTitle>
            <Receipt className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.facturesVente || 0}</div>
            <p className="text-xs text-slate-600 mt-1">Journal de vente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relevés Bancaires</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.facturesBanque || 0}</div>
            <p className="text-xs text-slate-600 mt-1">Journal banque</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Évolution des documents (6 derniers mois)</CardTitle>
          <p className="text-xs sm:text-sm text-slate-600">Nombre de documents par type et par mois</p>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ResponsiveContainer width="100%" height={300} className="sm:h-[350px]">
            <BarChart data={stats?.facturesParMois || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="mois" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ fontSize: '12px' }}
                labelStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconSize={12}
              />
              <Bar dataKey="achats" fill="#3b82f6" name="Achats" />
              <Bar dataKey="ventes" fill="#10b981" name="Ventes" />
              <Bar dataKey="banque" fill="#8b5cf6" name="Banque" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}