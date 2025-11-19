'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet } from 'lucide-react';

interface EcrituresFiltersProps {
  selectedMonth: string;
  selectedYear: string;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
  onExport: () => void;
  onExportByJournal: () => void;
  totalEcritures: number;
}

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

export function EcrituresFilters({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onExport,
  onExportByJournal,
  totalEcritures
}: EcrituresFiltersProps) {
  // Générer les années (année actuelle - 5 à année actuelle + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-slate-50 p-4 rounded-lg border">
      <div className="flex flex-col sm:flex-row gap-3 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Période :</span>
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-slate-600 flex items-center">
          <span className="font-medium">{totalEcritures}</span>
          <span className="ml-1">écriture{totalEcritures > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onExport}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={totalEcritures === 0}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exporter Excel</span>
          <span className="sm:hidden">Excel</span>
        </Button>

        <Button
          onClick={onExportByJournal}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={totalEcritures === 0}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">Par journal</span>
          <span className="sm:hidden">Journaux</span>
        </Button>
      </div>
    </div>
  );
}
