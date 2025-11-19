import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users } from 'lucide-react';
import type { DashboardStats } from '@/lib/types';

interface StatsCardsProps {
  stats: DashboardStats | null | undefined;
}

export function StatsCards({ stats }: StatsCardsProps) {
  // Si stats n'est pas encore chargé, afficher des valeurs par défaut
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {[...Array(2)].map((_, index) => (
          <Card key={index} className="bg-gray-50 border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  // Valeurs par défaut pour éviter les erreurs undefined
  const safeStats = {
    totalFactures: stats?.totalFactures ?? 0,
    nombreClients: stats?.nombreClients ?? 0,
    totalTTC: stats?.totalTTC ?? 0,
    totalTVA: stats?.totalTVA ?? 0,
    soldeClient: stats?.soldeClient ?? 0,
    facturesParMois: stats?.facturesParMois ?? []
  };

  const cards = [
    {
      title: 'Nombre de Clients',
      value: safeStats.nombreClients.toString(),
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Factures',
      value: safeStats.totalFactures.toString(),
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {cards.map((card, index) => (
        <Card key={index} className={`${card.bgColor} border-0 shadow-sm hover:shadow-md transition-shadow`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">
                  {card.title}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
                  {card.value}
                </p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${card.color} rounded-lg flex items-center justify-center flex-shrink-0 ml-2`}>
                <card.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}