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
    <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtres</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-gray-600 text-xs sm:text-sm px-2 sm:px-3"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Réinitialiser</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Recherche */}
        <div>
          <Label htmlFor="search" className="text-xs sm:text-sm">Recherche</Label>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 sm:left-3 top-2.5 sm:top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-8 sm:pl-10 text-xs sm:text-sm h-9 sm:h-10"
            />
          </div>
        </div>

        {/* Statut */}
        <div>
          <Label htmlFor="status" className="text-xs sm:text-sm">Statut</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="mt-1 text-xs sm:text-sm h-9 sm:h-10">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Année-Mois */}
        <div>
          <Label htmlFor="yearMonth" className="text-xs sm:text-sm">Période</Label>
          <Input
            id="yearMonth"
            type="month"
            value={filters.yearMonth}
            onChange={(e) => handleFilterChange('yearMonth', e.target.value)}
            placeholder="Mois/Année"
            className="mt-1 text-xs sm:text-sm h-9 sm:h-10"
          />
        </div>
      </div>
    </div>
  );
}