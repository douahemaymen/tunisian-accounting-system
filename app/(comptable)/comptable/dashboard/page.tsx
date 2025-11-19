'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ClientsStatsChart } from '@/components/charts/clients-stats-chart';
import type { DashboardStats } from '@/lib/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setIsLoading(false);
    }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-600 mt-1">Vue d'ensemble de votre comptabilité</p>
      </div>

      {stats && <StatsCards stats={stats} />}

      {/* Graphique des statistiques par client */}
      {stats && stats.clientsStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Graphique des Statistiques par Client
            </CardTitle>
            <p className="text-sm text-slate-500">Comparaison des achats, ventes et soldes par client</p>
          </CardHeader>
          <CardContent>
            <ClientsStatsChart clientsStats={stats.clientsStats} />
          </CardContent>
        </Card>
      )}

      {/* Tableau des statistiques par client */}
      {stats && stats.clientsStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Statistiques par Client
            </CardTitle>
            <p className="text-sm text-slate-500">Vue détaillée de l'activité de chaque client</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Client</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Factures</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Achats</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Ventes</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Banque</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Achats</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Ventes</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.clientsStats.map((client) => (
                    <tr key={client.uid} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-slate-900">{client.nom}</div>
                          <div className="text-sm text-slate-500">{client.societe}</div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold">
                          {client.nombreFactures}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-800 font-semibold">
                          {client.nombreAchats}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 font-semibold">
                          {client.nombreVentes}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-semibold">
                          {client.nombreBanque}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-red-600 font-medium">
                        {new Intl.NumberFormat('fr-TN', { 
                          style: 'currency', 
                          currency: 'TND' 
                        }).format(client.totalAchats)}
                      </td>
                      <td className="text-right py-3 px-4 text-green-600 font-medium">
                        {new Intl.NumberFormat('fr-TN', { 
                          style: 'currency', 
                          currency: 'TND' 
                        }).format(client.totalVentes)}
                      </td>
                      <td className={`text-right py-3 px-4 font-bold ${client.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('fr-TN', { 
                          style: 'currency', 
                          currency: 'TND' 
                        }).format(client.solde)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-3 px-4">TOTAL</td>
                    <td className="text-center py-3 px-4">{stats.totalFactures}</td>
                    <td className="text-center py-3 px-4">{stats.clientsStats.reduce((sum, c) => sum + c.nombreAchats, 0)}</td>
                    <td className="text-center py-3 px-4">{stats.clientsStats.reduce((sum, c) => sum + c.nombreVentes, 0)}</td>
                    <td className="text-center py-3 px-4">{stats.clientsStats.reduce((sum, c) => sum + c.nombreBanque, 0)}</td>
                    <td className="text-right py-3 px-4 text-red-600">
                      {new Intl.NumberFormat('fr-TN', { 
                        style: 'currency', 
                        currency: 'TND' 
                      }).format(stats.totalAchats)}
                    </td>
                    <td className="text-right py-3 px-4 text-green-600">
                      {new Intl.NumberFormat('fr-TN', { 
                        style: 'currency', 
                        currency: 'TND' 
                      }).format(stats.totalVentes)}
                    </td>
                    <td className={`text-right py-3 px-4 ${stats.soldeClient >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat('fr-TN', { 
                        style: 'currency', 
                        currency: 'TND' 
                      }).format(stats.soldeClient)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}