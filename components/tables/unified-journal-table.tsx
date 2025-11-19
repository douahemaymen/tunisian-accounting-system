'use client';

import { useState } from 'react';
import { InvoiceTable } from './invoice-table';
import { JournalBanqueTable } from './journal-banque-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Facture, JournalVente, JournalBanque } from '@/lib/types';

interface UnifiedJournalTableProps {
  journauxAchat: Facture[];
  journauxVente: JournalVente[];
  journauxBanque: JournalBanque[];
  selectedType: string;
  isLoading: boolean;
  showClient?: boolean;
  showActions?: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  onJournalUpdated?: () => void;
  onGenerateEcritures?: (item: any) => void;
  generatingEcritures?: string | null;
}

export function UnifiedJournalTable({
  journauxAchat,
  journauxVente,
  journauxBanque,
  selectedType,
  isLoading,
  showClient = false,
  showActions = false,
  onEdit,
  onDelete,
  onJournalUpdated,
  onGenerateEcritures,
  generatingEcritures
}: UnifiedJournalTableProps) {

  const renderTableByType = () => {
    switch (selectedType) {
      case 'J_ACH':
        return (
          <InvoiceTable
            factures={journauxAchat}
            isLoading={isLoading}
            showClient={showClient}
            onEdit={onEdit}
            onDelete={onDelete}
            showActions={showActions}
            onFactureUpdated={onJournalUpdated}
            onGenerateEcritures={onGenerateEcritures}
            generatingEcritures={generatingEcritures}
          />
        );
      
      case 'J_VTE':
        // Transformer les journaux de vente pour l'InvoiceTable
        const ventesTransformed = journauxVente.map(v => ({
          ...v,
          fournisseur: v.clientdefacture || 'Client de vente'
        })) as Facture[];
        
        return (
          <InvoiceTable
            factures={ventesTransformed}
            isLoading={isLoading}
            showClient={showClient}
            onEdit={onEdit}
            onDelete={onDelete}
            showActions={showActions}
            onFactureUpdated={onJournalUpdated}
            onGenerateEcritures={onGenerateEcritures}
            generatingEcritures={generatingEcritures}
          />
        );
      
      case 'J_BQ':
        return (
          <JournalBanqueTable
            journaux={journauxBanque}
            isLoading={isLoading}
            showClient={showClient}
            onEdit={onEdit}
            onDelete={onDelete}
            showActions={showActions}
            onJournalUpdated={onJournalUpdated}
            onGenerateEcritures={onGenerateEcritures}
            generatingEcritures={generatingEcritures}
          />
        );
      
      default:
        return (
          <div className="text-center py-8 text-slate-500">
            Sélectionnez un type de journal pour afficher les données
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderTableByType()}
    </div>
  );
}