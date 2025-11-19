'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, Calendar } from 'lucide-react';

interface DateMonthFilterProps {
  filters: {
    search: string;
    status: string;
    selectedMonth: string;
    selectedYear: string;
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'VALIDATED', label: 'Validées' },
  { value: 'REJECTED', label: 'Rejetées' }
];

const MONTHS = [
  { value: 'ALL', label: 'Tous les mois' },
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' }
];

const YEARS = [
  { value: 'ALL', label: 'Toutes les années' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' }
];

export function DateMonthFilter({ filters, onFiltersChange, onReset }: DateMonthFilterProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = filters.search !== '' || 
    filters.status !== 'ALL' || 
    filters.selectedMonth !== 'ALL' || 
    filters.selectedYear !== 'ALL';

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Filter className="w-6 h-6 text-gray-600" />
          <h3 className="text-xl font-bold text-gray-900">Filtres</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="default"
            onClick={onReset}
            className="text-gray-600 font-medium"
          >
            <X className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Recherche */}
        <div className="lg:col-span-1">
          <Label htmlFor="search" className="text-base font-semibold mb-2 block">Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="search"
              placeholder="Fournisseur, référence..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Statut */}
        <div>
          <Label htmlFor="status" className="text-base font-semibold mb-2 block">Statut</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="h-12 text-base">
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

        {/* Mois */}
        <div>
          <Label htmlFor="month" className="text-base font-semibold mb-2 block flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Mois
          </Label>
          <Select
            value={filters.selectedMonth}
            onValueChange={(value) => handleFilterChange('selectedMonth', value)}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Année */}
        <div>
          <Label htmlFor="year" className="text-base font-semibold mb-2 block">Année</Label>
          <Select
            value={filters.selectedYear}
            onValueChange={(value) => handleFilterChange('selectedYear', value)}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}