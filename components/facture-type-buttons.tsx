'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FactureTypeButtonsProps {
  factures: any[];
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

const TYPE_FACTURE_OPTIONS = [
  { value: 'ALL', label: 'Toutes', color: 'bg-gray-100 text-gray-800' },
  { value: 'FOURNISSEUR', label: 'Fournisseur', color: 'bg-blue-100 text-blue-800' },
  { value: 'CLIENT', label: 'Client', color: 'bg-green-100 text-green-800' },
  { value: 'AVOIR', label: 'Avoir', color: 'bg-orange-100 text-orange-800' },
  { value: 'DEVIS', label: 'Devis', color: 'bg-purple-100 text-purple-800' }
];

export function FactureTypeButtons({ factures, selectedType, onTypeSelect }: FactureTypeButtonsProps) {
  const getCountForType = (type: string) => {
    if (type === 'ALL') return factures.length;
    return factures.filter(f => f.type_facture === type).length;
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {TYPE_FACTURE_OPTIONS.map((option) => {
        const count = getCountForType(option.value);
        const isSelected = selectedType === option.value;
        
        return (
          <Button
            key={option.value}
            variant={isSelected ? "default" : "outline"}
            onClick={() => onTypeSelect(option.value)}
            className={`flex items-center space-x-2 ${isSelected ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
          >
            <span>{option.label}</span>
            <Badge 
              className={`${isSelected ? 'bg-white/20 text-white' : option.color} ml-2`}
            >
              {count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}