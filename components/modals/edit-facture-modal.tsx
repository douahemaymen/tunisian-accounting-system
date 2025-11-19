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
import type { Facture } from '@/lib/types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(amount) + ' DT';

interface EditFactureModalProps {
  isOpen: boolean;
  onClose: () => void;
  facture: Facture | null;
  onFactureUpdated: (updatedFacture: Facture) => void;
}

const TYPE_JOURNAL_OPTIONS = [
  { value: 'J_ACH', label: 'Journal d\'Achat' },
  { value: 'J_VTE', label: 'Journal de Vente' },
  { value: 'J_BQ', label: 'Journal de Banque' },
  { value: 'J_CA', label: 'Journal de Caisse' },
  { value: 'J_SAL', label: 'Journal de Salaire' },
  { value: 'J_OD', label: 'Journal d\'Opérations Diverses' }
];

const TYPE_FACTURE_ACHAT = [
  { value: 'FACTURE_ORDINAIRE_DT', label: 'Facture Ordinaire en DT' },
  { value: 'FACTURE_ORDINAIRE_DEVISE', label: 'Facture Ordinaire en devise' },
  { value: 'FACTURE_AVOIR', label: 'Facture Avoir' },
  { value: 'RISTOURNE_ACHAT', label: 'Ristourne Achat' }
];

const TYPE_FACTURE_VENTE = [
  { value: 'VENTE_ORDINAIRE_DT', label: 'Facture Ordinaire en DT' },
  { value: 'VENTE_ORDINAIRE_DEVISE', label: 'Facture Ordinaire en devise' },
  { value: 'VENTE_AVOIR', label: 'Facture Avoir' },
  { value: 'RISTOURNE_VENTE', label: 'Ristourne Vente' }
];

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'VALIDATED', label: 'Validée' },
  { value: 'REJECTED', label: 'Rejetée' },
  { value: 'COMPTABILISE', label: 'Comptabilisé' },
  { value: 'NON_COMPTABILISE', label: 'Non comptabilisé' }
];

export function EditFactureModal({ isOpen, onClose, facture, onFactureUpdated }: EditFactureModalProps) {
  const initialFormData = {
    fournisseur: '',
    clientdefacture: '',
    date: '',
    reference: '',
    total_ht: 0,
    tva_7: 0,
    tva_13: 0,
    tva_19: 0,
    total_tva: 0,
    total_ttc: 0,
    remise: 0,
    timbre_fiscal: 0,
    type_journal: '',
    type_facture: '',
    status: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [ecrituresComptables, setEcrituresComptables] = useState<any[]>([]);
  const [planComptable, setPlanComptable] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEcritures, setLoadingEcritures] = useState(false);
  const { toast } = useToast();

  // Réinitialiser le formulaire quand le modal se ferme
  const handleClose = () => {
    setFormData(initialFormData);
    setIsLoading(false);
    onClose();
  };

  useEffect(() => {
    if (facture && isOpen) {
      // Convertir les valeurs BigInt en nombres et formater la date
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      const convertToNumber = (value: any) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'bigint') return Number(value);
        if (typeof value === 'string') return parseFloat(value) || 0;
        return Number(value) || 0;
      };

      const isVente = facture.type_facture?.startsWith('VENTE_') || (facture as any).type_journal === 'J_VTE';

      setFormData({
        fournisseur: facture.fournisseur || '',
        clientdefacture: (facture as any).clientdefacture || '',
        date: formatDate(facture.date),
        reference: facture.reference || '',
        total_ht: convertToNumber(facture.total_ht),
        tva_7: convertToNumber(facture.tva_7),
        tva_13: convertToNumber(facture.tva_13),
        tva_19: convertToNumber(facture.tva_19),
        total_tva: convertToNumber(facture.total_tva),
        total_ttc: convertToNumber(facture.total_ttc),
        remise: convertToNumber(facture.remise),
        timbre_fiscal: convertToNumber(facture.timbre_fiscal),
        type_journal: (facture as any).type_journal || (isVente ? 'J_VTE' : 'J_ACH'),
        type_facture: facture.type_facture || '',
        status: facture.status || ''
      });

      // Charger le plan comptable et les écritures
      loadPlanComptable();
      loadEcritures();
    }
  }, [facture, isOpen]);

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
    if (!facture) return;
    
    setLoadingEcritures(true);
    try {
      const response = await fetch(`/api/ecritures-comptables?factureId=${facture.id}`);
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

  const calculateTotals = (data: typeof formData) => {
    const totalTva = data.tva_7 + data.tva_13 + data.tva_19;
    const totalTtc = data.total_ht + totalTva + data.timbre_fiscal - data.remise;

    return {
      ...data,
      total_tva: totalTva,
      total_ttc: totalTtc
    };
  };

  const handleInputChange = (field: string, value: string | number) => {
    const newData = {
      ...formData,
      [field]: typeof value === 'string' && !['fournisseur', 'clientdefacture', 'date', 'reference', 'type_journal', 'type_facture', 'status'].includes(field)
        ? parseFloat(value) || 0
        : value
    };

    // Recalculer les totaux si c'est un champ numérique
    if (['total_ht', 'tva_7', 'tva_13', 'tva_19', 'remise', 'timbre_fiscal'].includes(field)) {
      setFormData(calculateTotals(newData));
    } else {
      setFormData(newData);
    }
  };

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
    setEditingIndex(ecrituresComptables.length);
  };

  const getTotalDebit = () => ecrituresComptables.reduce((sum, e) => sum + (e.debit || 0), 0);
  const getTotalCredit = () => ecrituresComptables.reduce((sum, e) => sum + (e.credit || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!facture) return;

    // Vérifier l'équilibre des écritures
    if (ecrituresComptables.length > 0) {
      const totalDebit = getTotalDebit();
      const totalCredit = getTotalCredit();
      
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
      // Déterminer l'API à utiliser selon le type de journal
      const isVente = formData.type_journal === 'J_VTE' || formData.type_facture?.startsWith('VENTE_');
      const apiUrl = isVente 
        ? `/api/journal-vente/${facture.id}`
        : `/api/comptable-actions/factures/${facture.id}`;

      // Préparer les données selon le type
      const dataToSend = isVente 
        ? {
            // Pour les ventes : utiliser clientdefacture
            clientdefacture: formData.clientdefacture || formData.fournisseur,
            date: formData.date,
            reference: formData.reference,
            total_ht: formData.total_ht,
            tva_7: formData.tva_7,
            tva_13: formData.tva_13,
            tva_19: formData.tva_19,
            total_tva: formData.total_tva,
            total_ttc: formData.total_ttc,
            remise: formData.remise,
            timbre_fiscal: formData.timbre_fiscal,
            type_facture: formData.type_facture,
            status: formData.status,
            ecrituresComptables
          }
        : {
            // Pour les achats : utiliser fournisseur
            fournisseur: formData.fournisseur,
            date: formData.date,
            reference: formData.reference,
            total_ht: formData.total_ht,
            tva_7: formData.tva_7,
            tva_13: formData.tva_13,
            tva_19: formData.tva_19,
            total_tva: formData.total_tva,
            total_ttc: formData.total_ttc,
            remise: formData.remise,
            timbre_fiscal: formData.timbre_fiscal,
            type_facture: formData.type_facture,
            status: formData.status,
            ecrituresComptables
          };

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const updatedFacture = await response.json();
        toast({
          title: 'Succès',
          description: 'Facture modifiée avec succès',
        });
        onFactureUpdated(updatedFacture);
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
          <DialogTitle>Modifier la facture</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Informations générales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations générales</h3>

                  <div>
                    <Label htmlFor={formData.type_journal === 'J_VTE' ? 'clientdefacture' : 'fournisseur'}>
                      {formData.type_journal === 'J_VTE' ? 'Client' : 'Fournisseur'} *
                    </Label>
                    <Input
                      id={formData.type_journal === 'J_VTE' ? 'clientdefacture' : 'fournisseur'}
                      value={formData.type_journal === 'J_VTE' ? formData.clientdefacture : formData.fournisseur}
                      onChange={(e) => handleInputChange(
                        formData.type_journal === 'J_VTE' ? 'clientdefacture' : 'fournisseur', 
                        e.target.value
                      )}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="reference">Référence</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={(e) => handleInputChange('reference', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="type_journal">Type de journal</Label>
                    <Select
                      value={formData.type_journal}
                      onValueChange={(value) => handleInputChange('type_journal', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_JOURNAL_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type_facture">Type de facture</Label>
                    <Select
                      value={formData.type_facture}
                      onValueChange={(value) => handleInputChange('type_facture', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.type_journal === 'J_VTE' ? TYPE_FACTURE_VENTE : TYPE_FACTURE_ACHAT).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                {/* Montants */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Montants</h3>

                  <div>
                    <Label htmlFor="total_ht">Total HT *</Label>
                    <Input
                      id="total_ht"
                      type="number"
                      step="0.01"
                      value={formData.total_ht}
                      onChange={(e) => handleInputChange('total_ht', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="tva_7">TVA 7%</Label>
                      <Input
                        id="tva_7"
                        type="number"
                        step="0.01"
                        value={formData.tva_7}
                        onChange={(e) => handleInputChange('tva_7', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tva_13">TVA 13%</Label>
                      <Input
                        id="tva_13"
                        type="number"
                        step="0.01"
                        value={formData.tva_13}
                        onChange={(e) => handleInputChange('tva_13', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tva_19">TVA 19%</Label>
                      <Input
                        id="tva_19"
                        type="number"
                        step="0.01"
                        value={formData.tva_19}
                        onChange={(e) => handleInputChange('tva_19', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="total_tva">Total TVA (calculé)</Label>
                    <Input
                      id="total_tva"
                      type="number"
                      step="0.01"
                      value={formData.total_tva}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="remise">Remise</Label>
                    <Input
                      id="remise"
                      type="number"
                      step="0.01"
                      value={formData.remise}
                      onChange={(e) => handleInputChange('remise', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="timbre_fiscal">Timbre fiscal</Label>
                    <Input
                      id="timbre_fiscal"
                      type="number"
                      step="0.01"
                      value={formData.timbre_fiscal}
                      onChange={(e) => handleInputChange('timbre_fiscal', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="total_ttc">Total TTC (calculé)</Label>
                    <Input
                      id="total_ttc"
                      type="number"
                      step="0.01"
                      value={formData.total_ttc}
                      readOnly
                      className="bg-gray-50 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Section Écritures Comptables */}
              <div className="mt-6 space-y-4 pt-6 border-t">
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
                    {getTotalDebit() === getTotalCredit() ? (
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
                              {editingIndex === i ? (
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
                              {editingIndex === i ? (
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
                              {editingIndex === i ? (
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
                                {editingIndex === i ? (
                                  <Button 
                                    type="button"
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setEditingIndex(null)} 
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
                                      onClick={() => setEditingIndex(i)} 
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
                            {formatCurrency(getTotalDebit())}
                          </td>
                          <td className="px-4 py-2 text-right text-sm">
                            {formatCurrency(getTotalCredit())}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="text-sm text-slate-600">
                  <p>
                    Total Débit: {formatCurrency(getTotalDebit())} | Total Crédit: {formatCurrency(getTotalCredit())}
                    {getTotalDebit() !== getTotalCredit() && (
                      <span className="text-red-600 ml-2">
                        (Différence: {formatCurrency(Math.abs(getTotalDebit() - getTotalCredit()))})
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
                Image de la facture
              </h4>
              {facture?.image_url ? (
                <div className="p-6">
                  <ImageZoom
                    imageUrl={facture.image_url}
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