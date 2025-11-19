'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface SimpleFiltersProps {
  filters: {
    search: string;
    status: string;
    yearMonth: string;
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'VALIDATED', label: 'Validées' },
  { value: 'REJECTED', label: 'Rejetées' },
  { value: 'COMPTABILISE', label: 'Comptabilisées' }
];

export function SimpleFilters({ filters, onFiltersChange, onReset }: SimpleFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = filters.search !== '' ||
    filters.status !== 'ALL' ||
    filters.yearMonth !== '';

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-gray-600"
          >
            <X className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Recherche */}
        <div>
          <Label htmlFor="search">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Fournisseur, référence..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Statut */}
        <div>
          <Label htmlFor="status">Statut</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Année-Mois */}
        <div>
          <Label htmlFor="yearMonth">Période</Label>
          <Input
            id="yearMonth"
            type="month"
            value={filters.yearMonth}
            onChange={(e) => handleFilterChange('yearMonth', e.target.value)}
            placeholder="Sélectionner mois/année"
          />
        </div>
      </div>
    </div>
  );
}