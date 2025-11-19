'use client';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ShoppingCart, CreditCard, Calculator } from 'lucide-react';

interface JournalTypeSelectionProps {
  onSelect: (type: string) => void;
}

const JOURNAL_TYPES = [
  {
    id: 'J_ACH',
    label: 'Journal d\'Achat',
    description: 'Factures fournisseurs, achats de marchandises',
    icon: ShoppingCart,
    color: 'bg-blue-500'
  },
  {
    id: 'J_VTE',
    label: 'Journal de Vente',
    description: 'Factures clients, ventes de produits/services',
    icon: FileText,
    color: 'bg-green-500'
  },
  {
    id: 'J_BQ',
    label: 'Journal de Banque',
    description: 'Relevés bancaires, mouvements de trésorerie',
    icon: CreditCard,
    color: 'bg-purple-500'
  },
  {
    id: 'J_OD',
    label: 'Opérations Diverses',
    description: 'Écritures diverses, régularisations',
    icon: Calculator,
    color: 'bg-orange-500'
  }
];

export function JournalTypeSelection({ onSelect }: JournalTypeSelectionProps) {
  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Sélectionnez le type de document
        </h3>
        <p className="text-gray-600">
          Choisissez le type de journal correspondant à votre document
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {JOURNAL_TYPES.map((type) => {
          const IconComponent = type.icon;
          return (
            <Card
              key={type.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-blue-300"
              onClick={() => onSelect(type.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${type.color} text-white`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg">{type.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{type.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          💡 Astuce: Le type de journal détermine la catégorisation comptable de votre document
        </p>
      </div>
    </div>
  );
}