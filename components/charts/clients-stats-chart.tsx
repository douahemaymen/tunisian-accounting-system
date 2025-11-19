'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ClientStats } from '@/lib/types';

interface ClientsStatsChartProps {
  clientsStats: ClientStats[];
}

export function ClientsStatsChart({ clientsStats }: ClientsStatsChartProps) {
  // Préparer les données pour le graphique
  const chartData = clientsStats.map(client => ({
    name: client.nom.length > 15 ? client.nom.substring(0, 15) + '...' : client.nom,
    fullName: client.nom,
    Achats: client.totalAchats,
    Ventes: client.totalVentes,
    Solde: client.solde
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <YAxis 
          tick={{ fill: '#64748b', fontSize: 12 }}
          tickFormatter={formatCurrency}
        />
        <Tooltip 
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px'
          }}
          labelFormatter={(label) => {
            const item = chartData.find(d => d.name === label);
            return item?.fullName || label;
          }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        <Bar 
          dataKey="Achats" 
          fill="#ef4444" 
          radius={[8, 8, 0, 0]}
          name="Achats (Sorties)"
        />
        <Bar 
          dataKey="Ventes" 
          fill="#10b981" 
          radius={[8, 8, 0, 0]}
          name="Ventes (Entrées)"
        />
        <Bar 
          dataKey="Solde" 
          fill="#8b5cf6" 
          radius={[8, 8, 0, 0]}
          name="Solde Net"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
