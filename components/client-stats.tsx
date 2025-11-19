'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, CheckCircle } from 'lucide-react';

interface ClientStatsProps {
  clientUid: string;
  clientName: string;
  factures: any[];
}

export function ClientStats({ factures }: ClientStatsProps) {
  // Calcul des statistiques réelles
  const stats = {
    totalFactures: factures.length,
    montantTotal: factures.reduce((sum, f) => sum + (f.total_ttc || 0), 0),
    facturesEnAttente: factures.filter(f => f.status === 'PENDING').length,
    facturesValidees: factures.filter(f => f.status === 'VALIDATED').length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Factures</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalFactures}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">En Attente</p>
              <p className="text-2xl font-bold text-slate-900">{stats.facturesEnAttente}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Validées</p>
              <p className="text-2xl font-bold text-slate-900">{stats.facturesValidees}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}