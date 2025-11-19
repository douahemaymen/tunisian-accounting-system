'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Interface minimale pour les données nécessaires au filtrage
interface FactureMinimal {
  id: string;
  type_journal: string; // Type de journal (J_ACH, J_VTE, J_BQ, etc.)
}

interface JournalTypeFilterButtonsProps {
  factures: FactureMinimal[];
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

const JOURNAL_TYPES = [
  { value: 'J_ACH', label: 'Journal d\'Achat', color: 'bg-blue-100 text-blue-800' },
  { value: 'J_VTE', label: 'Journal de Vente', color: 'bg-green-100 text-green-800' },
  { value: 'J_BQ', label: 'Journal de Banque', color: 'bg-purple-100 text-purple-800' },
  { value: 'J_CA', label: 'Journal de Caisse', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'J_SAL', label: 'Journal de Salaire', color: 'bg-pink-100 text-pink-800' },
  { value: 'J_OD', label: 'Journal d\'OD', color: 'bg-orange-100 text-orange-800' }
];

export function JournalTypeFilterButtons({ factures, selectedType, onTypeSelect }: JournalTypeFilterButtonsProps) {
  // Calculer le nombre de factures par type
  const getCountByType = (type: string) => {
    return factures.filter(f => f.type_journal === type).length;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {JOURNAL_TYPES.map((type) => {
        const count = getCountByType(type.value);
        const isSelected = selectedType === type.value;

        return (
          <Button
            key={type.value}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onTypeSelect(type.value)}
            className={`flex items-center gap-2 ${isSelected
              ? 'bg-violet-600 hover:bg-violet-700 text-white'
              : 'hover:bg-gray-50'
              }`}
          >
            <span>{type.label}</span>
            <Badge
              variant="secondary"
              className={`${isSelected
                ? 'bg-white/20 text-white'
                : type.color
                } text-xs`}
            >
              {count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}