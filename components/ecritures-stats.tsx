'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { formatTND } from '@/lib/currency-utils';

interface EcrituresStatsProps {
  totalDebit: number;
  totalCredit: number;
  nombreEcritures: number;
  nombreFacturesComptabilisees: number;
}

export default function EcrituresStats({ 
  totalDebit, 
  totalCredit, 
  nombreEcritures, 
  nombreFacturesComptabilisees 
}: EcrituresStatsProps) {
  const solde = totalDebit - totalCredit;
  const isEquilibre = Math.abs(solde) < 0.001;

  const formatCurrency = formatTND;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Débit</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalDebit)}
          </div>
          <p className="text-xs text-muted-foreground">
            Montant total des débits
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Crédit</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalCredit)}
          </div>
          <p className="text-xs text-muted-foreground">
            Montant total des crédits
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Solde</CardTitle>
          <Calculator className={`h-4 w-4 ${isEquilibre ? 'text-green-600' : 'text-orange-600'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            isEquilibre ? 'text-green-600' : 
            solde > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {isEquilibre ? 'Équilibré' : formatCurrency(Math.abs(solde))}
          </div>
          <p className="text-xs text-muted-foreground">
            {isEquilibre ? 'Débit = Crédit' : solde > 0 ? 'Excédent débit' : 'Excédent crédit'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Écritures</CardTitle>
          <BarChart3 className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {nombreEcritures}
          </div>
          <p className="text-xs text-muted-foreground">
            {nombreFacturesComptabilisees} facture(s) comptabilisée(s)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}