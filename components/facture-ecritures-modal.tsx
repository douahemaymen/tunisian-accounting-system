'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, FileText } from 'lucide-react';
import { formatTND } from '@/lib/currency-utils';
import { useToast } from '@/hooks/use-toast';

interface EcritureComptable {
  id: string;
  date: string;
  libelle: string;
  debit: number;
  credit: number;
  planComptable: {
    num_compte: string;
    libelle: string;
    type_compte: string | null;
  };
}

interface FactureEcrituresModalProps {
  isOpen: boolean;
  onClose: () => void;
  factureId: string;
  factureReference: string;
}

export default function FactureEcrituresModal({ 
  isOpen, 
  onClose, 
  factureId, 
  factureReference 
}: FactureEcrituresModalProps) {
  const [ecritures, setEcritures] = useState<EcritureComptable[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && factureId) {
      fetchEcritures();
    }
  }, [isOpen, factureId]);

  const fetchEcritures = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ecritures-comptables?factureId=${factureId}`);
      if (response.ok) {
        const data = await response.json();
        setEcritures(data);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les écritures comptables',
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
      setLoading(false);
    }
  };

  const totalDebit = ecritures.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = ecritures.reduce((sum, e) => sum + e.credit, 0);

  const formatCurrency = formatTND;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Écritures comptables - {factureReference}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-lg">Chargement...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {ecritures.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune écriture comptable pour cette facture</p>
                <p className="text-sm">Utilisez le bouton "Comptabiliser" pour générer les écritures automatiquement</p>
              </div>
            ) : (
              <>
                {/* Résumé */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-600">Total Débit</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(totalDebit)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-600">Total Crédit</div>
                      <div className="text-xl font-bold text-red-600">
                        {formatCurrency(totalCredit)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tableau des écritures */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Compte</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead className="text-right">Débit</TableHead>
                        <TableHead className="text-right">Crédit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ecritures.map((ecriture) => (
                        <TableRow key={ecriture.id}>
                          <TableCell>{formatDate(ecriture.date)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{ecriture.planComptable.num_compte}</div>
                            <div className="text-sm text-gray-500">{ecriture.planComptable.libelle}</div>
                          </TableCell>
                          <TableCell>{ecriture.libelle}</TableCell>
                          <TableCell className="text-right font-medium">
                            {ecriture.debit > 0 ? formatCurrency(ecriture.debit) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {ecriture.credit > 0 ? formatCurrency(ecriture.credit) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Vérification de l'équilibre */}
                <div className="flex justify-center">
                  <div className={`px-4 py-2 rounded-lg ${
                    Math.abs(totalDebit - totalCredit) < 0.001 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {Math.abs(totalDebit - totalCredit) < 0.001 
                      ? '✓ Écritures équilibrées' 
                      : `⚠ Déséquilibre: ${formatCurrency(Math.abs(totalDebit - totalCredit))}`
                    }
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}