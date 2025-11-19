'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { JournalBanque } from '@/lib/types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(amount) + ' DT';

interface MouvementsBanqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: JournalBanque | null;
}

export function MouvementsBanqueModal({ isOpen, onClose, journal }: MouvementsBanqueModalProps) {
  const mouvements = journal?.mouvements || [];
  const totalDebit = mouvements.reduce((sum, m) => sum + (m.debit || 0), 0);
  const totalCredit = mouvements.reduce((sum, m) => sum + (m.credit || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold">Mouvements bancaires</div>
              {journal && (
                <div className="text-sm font-normal text-slate-600 mt-1">
                  {journal.titulaire} - {journal.numero_compte} - {new Date(journal.date).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mouvements.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg">Aucun mouvement trouvé</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Libellé</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Débit</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Crédit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mouvements.map((mouvement, index) => (
                      <TableRow key={mouvement.id || index} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          {new Date(mouvement.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{mouvement.libelle}</TableCell>
                        <TableCell className="text-right">
                          {mouvement.debit > 0 ? (
                            <span className="text-red-600 font-medium">
                              {formatCurrency(mouvement.debit)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {mouvement.credit > 0 ? (
                            <span className="text-green-600 font-medium">
                              {formatCurrency(mouvement.credit)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-100 font-semibold border-t-2">
                      <TableCell colSpan={2} className="text-right">Total</TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(totalDebit)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(totalCredit)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {mouvements.map((mouvement, index) => (
                  <div 
                    key={mouvement.id || index} 
                    className="bg-white border border-slate-200 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{mouvement.libelle}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(mouvement.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <div>
                        <p className="text-xs text-slate-500">Débit</p>
                        <p className="text-sm font-medium text-red-600">
                          {mouvement.debit > 0 ? formatCurrency(mouvement.debit) : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Crédit</p>
                        <p className="text-sm font-medium text-green-600">
                          {mouvement.credit > 0 ? formatCurrency(mouvement.credit) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mobile Total */}
                <div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
                  <div className="flex justify-between font-semibold">
                    <div>
                      <p className="text-xs text-slate-600">Total Débit</p>
                      <p className="text-lg text-red-600">{formatCurrency(totalDebit)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600">Total Crédit</p>
                      <p className="text-lg text-green-600">{formatCurrency(totalCredit)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      📊 Résumé : {mouvements.length} mouvement{mouvements.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Solde : {formatCurrency(totalCredit - totalDebit)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-600">Différence</p>
                    <p className={`text-sm font-semibold ${
                      totalCredit - totalDebit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {totalCredit - totalDebit >= 0 ? '+' : ''}{formatCurrency(totalCredit - totalDebit)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
