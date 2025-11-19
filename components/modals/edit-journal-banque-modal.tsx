'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, FileText, Calculator, Edit2, Trash2, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageZoom } from '@/components/ui/image-zoom';
import type { JournalBanque } from '@/lib/types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(amount) + ' DT';

interface EditJournalBanqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: JournalBanque | null;
  onJournalUpdated: (updatedJournal: JournalBanque) => void;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'VALIDATED', label: 'Validé' },
  { value: 'REJECTED', label: 'Rejeté' },
  { value: 'COMPTABILISE', label: 'Comptabilisé' },
  { value: 'NON_COMPTABILISE', label: 'Non comptabilisé' }
];

export function EditJournalBanqueModal({ isOpen, onClose, journal, onJournalUpdated }: EditJournalBanqueModalProps) {
  const initialFormData = {
    date: '',
    numero_compte: '',
    titulaire: '',
    status: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [mouvements, setMouvements] = useState<any[]>([]);
  const [ecrituresComptables, setEcrituresComptables] = useState<any[]>([]);
  const [planComptable, setPlanComptable] = useState<any[]>([]);
  const [editingMouvementIndex, setEditingMouvementIndex] = useState<number | null>(null);
  const [editingEcritureIndex, setEditingEcritureIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEcritures, setLoadingEcritures] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setFormData(initialFormData);
    setMouvements([]);
    setEcrituresComptables([]);
    setIsLoading(false);
    onClose();
  };

  useEffect(() => {
    if (journal && isOpen) {
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      setFormData({
        date: formatDate(journal.date),
        numero_compte: journal.numero_compte || '',
        titulaire: journal.titulaire || '',
        status: journal.status || 'PENDING'
      });

      // Charger les mouvements
      setMouvements(journal.mouvements?.map(m => ({
        id: m.id,
        date: m.date,
        libelle: m.libelle,
        debit: m.debit || 0,
        credit: m.credit || 0
      })) || []);

      // Charger le plan comptable et les écritures
      loadPlanComptable();
      loadEcritures();
    }
  }, [journal, isOpen]);

  const loadPlanComptable = async () => {
    try {
      const response = await fetch('/api/plancomptable');
      if (response.ok) {
        const data = await response.json();
        setPlanComptable(data);
      }
    } catch (error) {
      console.error('Erreur chargement plan comptable:', error);
    }
  };

  const loadEcritures = async () => {
    if (!journal) return;
    
    setLoadingEcritures(true);
    try {
      const response = await fetch(`/api/ecritures-comptables?journalBanqueId=${journal.id}`);
      if (response.ok) {
        const data = await response.json();
        setEcrituresComptables(data.map((e: any) => ({
          id: e.id,
          num_compte: e.num_compte,
          libelle: e.libelle,
          debit: e.debit,
          credit: e.credit
        })));
      }
    } catch (error) {
      console.error('Erreur chargement écritures:', error);
    } finally {
      setLoadingEcritures(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Gestion des mouvements
  const handleEditMouvement = (index: number, field: string, value: string) => {
    const newMouvements = [...mouvements];
    if (field === 'debit' || field === 'credit') {
      newMouvements[index] = { 
        ...newMouvements[index], 
        [field]: parseFloat(value) || 0 
      };
    } else {
      newMouvements[index] = { 
        ...newMouvements[index], 
        [field]: value 
      };
    }
    setMouvements(newMouvements);
  };

  const handleDeleteMouvement = (index: number) => {
    setMouvements(mouvements.filter((_, i) => i !== index));
  };

  const handleAddMouvement = () => {
    setMouvements([
      ...mouvements, 
      { date: formData.date, libelle: '', debit: 0, credit: 0 }
    ]);
    setEditingMouvementIndex(mouvements.length);
  };

  const getTotalDebitMouvements = () => mouvements.reduce((sum, m) => sum + (m.debit || 0), 0);
  const getTotalCreditMouvements = () => mouvements.reduce((sum, m) => sum + (m.credit || 0), 0);

  // Gestion des écritures comptables
  const handleEditEcriture = (index: number, field: string, value: string) => {
    const newEcritures = [...ecrituresComptables];
    if (field === 'num_compte') {
      const compte = planComptable.find(c => c.num_compte === value);
      if (compte) {
        newEcritures[index] = { 
          ...newEcritures[index], 
          num_compte: compte.num_compte, 
          libelle: compte.libelle 
        };
      }
    } else if (field === 'debit' || field === 'credit') {
      newEcritures[index] = { 
        ...newEcritures[index], 
        [field]: parseFloat(value) || 0 
      };
    } else {
      newEcritures[index] = { 
        ...newEcritures[index], 
        [field]: value 
      };
    }
    setEcrituresComptables(newEcritures);
  };

  const handleDeleteEcriture = (index: number) => {
    setEcrituresComptables(ecrituresComptables.filter((_, i) => i !== index));
  };

  const handleAddEcriture = () => {
    setEcrituresComptables([
      ...ecrituresComptables, 
      { num_compte: '', libelle: '', debit: 0, credit: 0 }
    ]);
    setEditingEcritureIndex(ecrituresComptables.length);
  };

  const getTotalDebitEcritures = () => ecrituresComptables.reduce((sum, e) => sum + (e.debit || 0), 0);
  const getTotalCreditEcritures = () => ecrituresComptables.reduce((sum, e) => sum + (e.credit || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!journal) return;

    // Vérifier l'équilibre des écritures
    if (ecrituresComptables.length > 0) {
      const totalDebit = getTotalDebitEcritures();
      const totalCredit = getTotalCreditEcritures();
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        toast({
          title: 'Erreur',
          description: `Les écritures ne sont pas équilibrées. Débit: ${formatCurrency(totalDebit)}, Crédit: ${formatCurrency(totalCredit)}`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/journal-banque/${journal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          mouvements,
          ecrituresComptables
        }),
      });

      if (response.ok) {
        const updatedJournal = await response.json();
        toast({
          title: 'Succès',
          description: 'Journal banque modifié avec succès',
        });
        onJournalUpdated(updatedJournal);
        handleClose();
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Erreur lors de la modification',
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le journal banque</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Informations générales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informations générales</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="numero_compte">Numéro de compte *</Label>
                    <Input
                      id="numero_compte"
                      value={formData.numero_compte}
                      onChange={(e) => handleInputChange('numero_compte', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="titulaire">Titulaire *</Label>
                    <Input
                      id="titulaire"
                      value={formData.titulaire}
                      onChange={(e) => handleInputChange('titulaire', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
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
              </div>

              {/* Mouvements bancaires */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center">
                    🏦 Mouvements bancaires
                  </h3>
                  <Button 
                    type="button"
                    onClick={handleAddMouvement} 
                    size="sm" 
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>

                {mouvements.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border rounded-lg">
                    Aucun mouvement. Cliquez sur "Ajouter" pour en créer.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold">Libellé</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold">Débit</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold">Crédit</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mouvements.map((m, i) => (
                            <tr key={i} className="border-t hover:bg-gray-50">
                              <td className="px-2 py-2">
                                {editingMouvementIndex === i ? (
                                  <Input 
                                    type="date" 
                                    value={m.date} 
                                    onChange={(e) => handleEditMouvement(i, 'date', e.target.value)} 
                                    className="text-sm"
                                  />
                                ) : (
                                  <span className="text-sm">{m.date}</span>
                                )}
                              </td>
                              <td className="px-2 py-2">
                                {editingMouvementIndex === i ? (
                                  <Input 
                                    value={m.libelle} 
                                    onChange={(e) => handleEditMouvement(i, 'libelle', e.target.value)} 
                                    className="text-sm"
                                  />
                                ) : (
                                  <span className="text-sm">{m.libelle}</span>
                                )}
                              </td>
                              <td className="px-2 py-2">
                                {editingMouvementIndex === i ? (
                                  <Input 
                                    type="number" 
                                    step="0.001" 
                                    value={m.debit} 
                                    onChange={(e) => handleEditMouvement(i, 'debit', e.target.value)} 
                                    className="text-right text-sm"
                                  />
                                ) : (
                                  <span className="text-right text-sm block">
                                    {m.debit > 0 ? formatCurrency(m.debit) : '-'}
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-2">
                                {editingMouvementIndex === i ? (
                                  <Input 
                                    type="number" 
                                    step="0.001" 
                                    value={m.credit} 
                                    onChange={(e) => handleEditMouvement(i, 'credit', e.target.value)} 
                                    className="text-right text-sm"
                                  />
                                ) : (
                                  <span className="text-right text-sm block">
                                    {m.credit > 0 ? formatCurrency(m.credit) : '-'}
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-2">
                                <div className="flex justify-center space-x-1">
                                  {editingMouvementIndex === i ? (
                                    <Button 
                                      type="button"
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => setEditingMouvementIndex(null)} 
                                      className="h-8 w-8 p-0"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <>
                                      <Button 
                                        type="button"
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => setEditingMouvementIndex(i)} 
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        type="button"
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => handleDeleteMouvement(i)} 
                                        className="h-8 w-8 p-0 text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-2 font-semibold">
                          <tr>
                            <td colSpan={2} className="px-4 py-2 text-sm">Total</td>
                            <td className="px-4 py-2 text-right text-sm">
                              {formatCurrency(getTotalDebitMouvements())}
                            </td>
                            <td className="px-4 py-2 text-right text-sm">
                              {formatCurrency(getTotalCreditMouvements())}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Section Écritures Comptables */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-green-600" />
                    Écritures comptables
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button 
                      type="button"
                      onClick={handleAddEcriture} 
                      size="sm" 
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                    {getTotalDebitEcritures() === getTotalCreditEcritures() ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">Équilibrée</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">Déséquilibrée</span>
                      </div>
                    )}
                  </div>
                </div>

                {loadingEcritures ? (
                  <div className="text-center py-8 text-slate-500">
                    Chargement des écritures...
                  </div>
                ) : ecrituresComptables.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border rounded-lg">
                    Aucune écriture comptable. Cliquez sur "Ajouter" pour en créer.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Compte</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">Libellé</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Débit</th>
                          <th className="px-4 py-2 text-right text-sm font-semibold">Crédit</th>
                          <th className="px-4 py-2 text-center text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ecrituresComptables.map((e, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-2">
                              {editingEcritureIndex === i ? (
                                <Select 
                                  value={e.num_compte} 
                                  onValueChange={(v) => handleEditEcriture(i, 'num_compte', v)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Compte" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {planComptable.map(c => (
                                      <SelectItem key={c.id} value={c.num_compte}>
                                        {c.num_compte} - {c.libelle}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="font-mono text-sm">{e.num_compte}</span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <span className="text-sm">{e.libelle}</span>
                            </td>
                            <td className="px-2 py-2">
                              {editingEcritureIndex === i ? (
                                <Input 
                                  type="number" 
                                  step="0.001" 
                                  value={e.debit} 
                                  onChange={(ev) => handleEditEcriture(i, 'debit', ev.target.value)} 
                                  className="text-right" 
                                />
                              ) : (
                                <span className="text-right text-sm block">
                                  {e.debit > 0 ? formatCurrency(e.debit) : '-'}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              {editingEcritureIndex === i ? (
                                <Input 
                                  type="number" 
                                  step="0.001" 
                                  value={e.credit} 
                                  onChange={(ev) => handleEditEcriture(i, 'credit', ev.target.value)} 
                                  className="text-right" 
                                />
                              ) : (
                                <span className="text-right text-sm block">
                                  {e.credit > 0 ? formatCurrency(e.credit) : '-'}
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex justify-center space-x-1">
                                {editingEcritureIndex === i ? (
                                  <Button 
                                    type="button"
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setEditingEcritureIndex(null)} 
                                    className="h-8 w-8 p-0"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <>
                                    <Button 
                                      type="button"
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => setEditingEcritureIndex(i)} 
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      type="button"
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleDeleteEcriture(i)} 
                                      className="h-8 w-8 p-0 text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t bg-slate-50 font-semibold">
                          <td colSpan={2} className="px-4 py-2 text-sm">Total</td>
                          <td className="px-4 py-2 text-right text-sm">
                            {formatCurrency(getTotalDebitEcritures())}
                          </td>
                          <td className="px-4 py-2 text-right text-sm">
                            {formatCurrency(getTotalCreditEcritures())}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="text-sm text-slate-600">
                  <p>
                    Total Débit: {formatCurrency(getTotalDebitEcritures())} | Total Crédit: {formatCurrency(getTotalCreditEcritures())}
                    {getTotalDebitEcritures() !== getTotalCreditEcritures() && (
                      <span className="text-red-600 ml-2">
                        (Différence: {formatCurrency(Math.abs(getTotalDebitEcritures() - getTotalCreditEcritures()))})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Colonne image */}
            <div className="bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200">
              <h4 className="text-lg font-semibold p-4 bg-gray-800 text-white flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Image du relevé
              </h4>
              {journal?.image_url ? (
                <div className="p-6">
                  <ImageZoom
                    imageUrl={journal.image_url}
                    className="w-full h-auto min-h-[700px] max-h-[800px]"
                    zoomScale={2.5}
                  />
                </div>
              ) : (
                <div className="h-[700px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Aucune image disponible</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
