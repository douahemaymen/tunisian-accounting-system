'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatTND } from '@/lib/currency-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EcritureComptable } from '@/lib/types';

interface JournalBanqueEcrituresModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalBanqueId: string;
  journalDate: string;
}

export function JournalBanqueEcrituresModal({
  isOpen,
  onClose,
  journalBanqueId,
  journalDate,
}: JournalBanqueEcrituresModalProps) {
  const [ecritures, setEcritures] = useState<EcritureComptable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && journalBanqueId) {
      fetchEcritures();
    }
  }, [isOpen, journalBanqueId]);

  const fetchEcritures = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ecritures-comptables?journalBanqueId=${journalBanqueId}`);
      if (response.ok) {
        const data = await response.json();
        setEcritures(Array.isArray(data) ? data : []);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les écritures',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalDebit = ecritures.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = ecritures.reduce((sum, e) => sum + (e.credit || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Écritures Comptables - {journalDate}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {ecritures.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Aucune écriture comptable pour ce journal
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Libellé</TableHead>
                        <TableHead className="font-semibold">Compte</TableHead>
                        <TableHead className="font-semibold text-right">Débit</TableHead>
                        <TableHead className="font-semibold text-right">Crédit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ecritures.map((ecriture) => (
                        <TableRow key={ecriture.id} className="hover:bg-slate-50">
                          <TableCell className="text-sm">
                            {new Date(ecriture.date).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-sm">{ecriture.libelle}</TableCell>
                          <TableCell className="text-sm font-mono">
                            <div>{ecriture.planComptable?.num_compte}</div>
                            <div className="text-xs text-slate-500">{ecriture.planComptable?.libelle}</div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {ecriture.debit > 0 ? formatTND(ecriture.debit) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {ecriture.credit > 0 ? formatTND(ecriture.credit) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-slate-50 font-semibold">
                        <TableCell colSpan={3} className="text-right">Total</TableCell>
                        <TableCell className="text-right">{formatTND(totalDebit)}</TableCell>
                        <TableCell className="text-right">{formatTND(totalCredit)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={onClose}>
                    Fermer
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
