'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, Eye, Calculator, CheckCircle, AlertCircle, Edit2, Trash2, Plus, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { extractInvoiceAndGenerateEntries } from '@/lib/gemini';
import { JournalTypeSelection } from './journal-type-selection';
import { Spinner } from '@/components/ui/spinner';
import { ImageZoom } from '@/components/ui/image-zoom';

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

const formatCurrency = (amount) =>
  new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(amount) + ' DT';

export function ScanFactureModal({ isOpen, onClose, clientUid, clientName, onFactureAdded }) {
  const [step, setStep] = useState('journal-type');
  const [selectedJournalType, setSelectedJournalType] = useState(null);
  const [selectedFactureType, setSelectedFactureType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [extractedJournalBanqueData, setExtractedJournalBanqueData] = useState(null);
  const [ecrituresComptables, setEcrituresComptables] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [fileType, setFileType] = useState('image');
  const [isLoading, setIsLoading] = useState(false);
  const [planComptable, setPlanComptable] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const { toast } = useToast();

  const resetModal = () => {
    setStep('journal-type');
    setSelectedJournalType(null);
    setSelectedFactureType(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setExtractedData(null);
    setExtractedJournalBanqueData(null);
    setEcrituresComptables([]);
    setImageUrl('');
    setFileType('image');
    setIsLoading(false);
  };

  const handleJournalTypeSelect = (type) => {
    setSelectedJournalType(type);
    setStep((type === 'J_ACH' || type === 'J_VTE') ? 'facture-type' : 'upload');
  };

  const handleFactureTypeSelect = (type) => {
    setSelectedFactureType(type);
    setStep('upload');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setFileType(file.type === 'application/pdf' ? 'pdf' : 'image');
  };

  const handleScan = async () => {
    if (!selectedFile || !selectedJournalType) return;

    setStep('loading');
    setIsLoading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(20);
      toast({ title: 'Upload en cours', description: `Upload du ${fileType === 'pdf' ? 'PDF' : 'image'} vers Cloudinary...` });

      const uploadResult = await uploadImageToCloudinary(selectedFile);
      setImageUrl(uploadResult.secure_url || uploadResult.url);
      setUploadProgress(40);

      setUploadProgress(50);
      toast({ title: 'Chargement du plan comptable', description: 'Récupération des comptes comptables...' });

      const planComptableResponse = await fetch('/api/plancomptable');
      const planComptableData = await planComptableResponse.json();
      setPlanComptable(planComptableData);
      setUploadProgress(60);

      toast({ title: 'Analyse intelligente en cours', description: 'Extraction des données ET génération des écritures comptables...' });

      const result = await extractInvoiceAndGenerateEntries(selectedFile, planComptableData, selectedJournalType);
      setUploadProgress(90);

      if (selectedJournalType === 'J_BQ') {
        const resultData = result.facture as any;
        setExtractedJournalBanqueData({
          date: resultData.date || new Date().toISOString().slice(0, 10),
          numero_compte: resultData.numero_compte || '',
          titulaire: resultData.titulaire || '',
          matricule_fiscal: resultData.matricule_fiscal || '',
          solde_initial: resultData.solde_initial || 0,
          total_credits: resultData.total_credits || 0,
          total_debits: resultData.total_debits || 0,
          frais_bancaires: resultData.frais_bancaires || 0,
          solde_final: resultData.solde_final || 0,
          type_journal: selectedJournalType,
          mouvements: resultData.mouvements || []
        });
      } else {
        // Pour les ventes, utiliser clientdefacture au lieu de fournisseur
        const isVente = selectedJournalType === 'J_VTE';
        const factureData: any = result.facture;
        setExtractedData({
          fournisseur: factureData.fournisseur || (isVente ? 'Client non détecté' : 'Fournisseur non détecté'),
          clientdefacture: isVente ? (factureData.clientdefacture || factureData.fournisseur || 'Client non détecté') : undefined,
          date: result.facture.date || new Date().toISOString().slice(0, 10),
          reference: result.facture.reference || `REF-${Date.now()}`,
          total_ht: result.facture.total_ht || 0,
          tva_7: result.facture.tva_7 || 0,
          tva_13: result.facture.tva_13 || 0,
          tva_19: result.facture.tva_19 || 0,
          total_tva: result.facture.total_tva || 0,
          total_ttc: result.facture.total_ttc || 0,
          remise: result.facture.remise || 0,
          timbre_fiscal: result.facture.timbre_fiscal || 0,
          type_journal: selectedJournalType,
          type_facture: result.facture.type_facture === 'avoir' ? 'AVOIR' : 'FOURNISSEUR'
        });
      }

      setEcrituresComptables(result.ecritures);
      setUploadProgress(100);
      toast({ title: '✅ Analyse terminée !', description: `Données extraites et ${result.ecritures.length} écritures générées automatiquement` });
      setStep('extracted');

    } catch (error) {
      console.error('Erreur lors du scan:', error);
      
      // Améliorer le message d'erreur pour les erreurs 503
      let errorMessage = error.message || 'Erreur lors du scan de la facture';
      let errorTitle = 'Erreur';
      
      if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE')) {
        errorTitle = 'Service temporairement indisponible';
        errorMessage = 'L\'API Gemini est surchargée. Le système a réessayé automatiquement mais sans succès. Veuillez réessayer dans quelques instants.';
      } else if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        errorTitle = 'Limite de requêtes atteinte';
        errorMessage = 'Vous avez atteint la limite de requêtes. Veuillez patienter quelques minutes avant de réessayer.';
      }
      
      toast({ title: errorTitle, description: errorMessage, variant: 'destructive' });
      setStep('upload');
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleInputChange = (field, value) => {
    if (!extractedData) return;
    const newData = {
      ...extractedData,
      [field]: ['fournisseur', 'clientdefacture', 'date', 'reference', 'type_journal', 'type_facture'].includes(field)
        ? value
        : parseFloat(value) || 0
    };
    setExtractedData(newData);
    if (['total_ht', 'total_tva', 'total_ttc', 'type_journal'].includes(field)) {
      setEcrituresComptables([]);
    }
  };



  const handleEditEcriture = (index, field, value) => {
    const newEcritures = [...ecrituresComptables];
    if (field === 'num_compte') {
      const compte = planComptable.find(c => c.num_compte === value);
      if (compte) {
        newEcritures[index] = { ...newEcritures[index], num_compte: compte.num_compte, libelle: compte.libelle };
      }
    } else {
      newEcritures[index] = { ...newEcritures[index], [field]: parseFloat(value) || 0 };
    }
    setEcrituresComptables(newEcritures);
  };

  const handleDeleteEcriture = (index) => {
    setEcrituresComptables(ecrituresComptables.filter((_, i) => i !== index));
  };

  const handleAddEcriture = () => {
    setEcrituresComptables([...ecrituresComptables, { num_compte: '', libelle: '', debit: 0, credit: 0 }]);
    setEditingIndex(ecrituresComptables.length);
  };

  const getTotalDebit = () => ecrituresComptables.reduce((sum, e) => sum + e.debit, 0);
  const getTotalCredit = () => ecrituresComptables.reduce((sum, e) => sum + e.credit, 0);

  const handleSave = async () => {
    if (!extractedData && !extractedJournalBanqueData) return;
    setIsLoading(true);

    try {
      // Déterminer l'API à appeler selon le type de journal
      let apiUrl = '/api/comptable-actions/factures'; // Par défaut pour les achats
      
      if (extractedJournalBanqueData) {
        apiUrl = '/api/journal-banque';
      } else if (selectedJournalType === 'J_VTE') {
        apiUrl = '/api/journal-vente';
      }

      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientUid,
            imageUrl,
            extractedData: extractedJournalBanqueData || { ...extractedData, type_facture: selectedFactureType || extractedData.type_facture },
            ecrituresComptables
          })
        }
      );

      if (response.ok) {
        const savedDocument = await response.json();
        toast({
          title: extractedJournalBanqueData ? '🏦 Journal Banque enregistré !' : '🧠 Facture enregistrée avec écritures !',
          description: extractedJournalBanqueData
            ? `Journal banque avec ${extractedJournalBanqueData.mouvements?.length || 0} mouvement(s) et ${ecrituresComptables.length} écriture(s) comptable(s) sauvegardé`
            : `Facture et ${ecrituresComptables.length} écriture(s) sauvegardée(s)`
        });
        onFactureAdded(savedDocument);
        handleClose();
      } else {
        const error = await response.json();
        toast({ title: 'Erreur', description: error.error || 'Erreur lors de l\'enregistrement', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur de connexion', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const factureTypeOptions = selectedJournalType === 'J_ACH' ? TYPE_FACTURE_ACHAT : TYPE_FACTURE_VENTE;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Scanner une facture pour {clientName}
            {selectedJournalType && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({TYPE_JOURNAL_OPTIONS.find(t => t.value === selectedJournalType)?.label})
                {selectedFactureType && (
                  <span className="text-xs text-blue-600 ml-1">
                    - {factureTypeOptions.find(t => t.value === selectedFactureType)?.label}
                  </span>
                )}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 'journal-type' && <JournalTypeSelection onSelect={handleJournalTypeSelect} />}

        {step === 'facture-type' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Sélectionnez le type de facture</h3>
              <p className="text-gray-600">Choisissez le type de facture correspondant à votre document</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {factureTypeOptions.map((type) => (
                <div key={type.value} className="cursor-pointer p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-lg transition-all duration-200 hover:scale-105" onClick={() => handleFactureTypeSelect(type.value)}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg text-white ${selectedJournalType === 'J_ACH' ? 'bg-blue-500' : 'bg-green-500'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-medium">{type.label}</h4>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setStep('journal-type')}><X className="w-4 h-4 mr-2" />Retour</Button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-6 p-6">
            <div className="text-center mb-4">
              <h4 className="text-xl font-semibold mb-2 text-gray-800">Sélectionnez votre document à analyser</h4>
              <p className="text-gray-600">Choisissez une image ou un PDF de votre facture</p>
            </div>
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="cursor-pointer"
              />
              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileSelect(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setStep((selectedJournalType === 'J_ACH' || selectedJournalType === 'J_VTE') ? 'facture-type' : 'journal-type')}>
                <X className="w-4 h-4 mr-2" />Retour
              </Button>
              <Button onClick={handleScan} disabled={!selectedFile}><Upload className="w-4 h-4 mr-2" />Analyser le document</Button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="space-y-6 py-12">
            <div className="text-center">
              <Spinner text="Analyse en cours..." size="lg" />
              <div className="mt-6">
                <Progress value={uploadProgress} className="h-3 max-w-md mx-auto" />
                <div className="text-sm text-slate-600 mt-2">{uploadProgress}%</div>
                <div className="text-xs text-slate-500 mt-1">
                  {uploadProgress < 30 && "Upload vers Cloudinary..."}
                  {uploadProgress >= 30 && uploadProgress < 80 && "Extraction avec Gemini AI..."}
                  {uploadProgress >= 80 && "Finalisation..."}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'extracted' && (extractedData || extractedJournalBanqueData) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Vérification des données extraites</h3>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Écritures générées automatiquement</span>
                </div>
              </div>

              {/* Formulaire conditionnel */}
              {!extractedJournalBanqueData && extractedData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label>{selectedJournalType === 'J_VTE' ? 'Client' : 'Fournisseur'} *</Label>
                      <Input 
                        value={selectedJournalType === 'J_VTE' ? ((extractedData as any).clientdefacture || extractedData.fournisseur) : extractedData.fournisseur} 
                        onChange={(e) => handleInputChange(selectedJournalType === 'J_VTE' ? 'clientdefacture' : 'fournisseur', e.target.value)} 
                      />
                    </div>
                    <div><Label>Date</Label><Input type="date" value={extractedData.date} onChange={(e) => handleInputChange('date', e.target.value)} /></div>
                    <div><Label>Référence</Label><Input value={extractedData.reference} onChange={(e) => handleInputChange('reference', e.target.value)} /></div>
                    <div><Label>Type de journal</Label><Select value={extractedData.type_journal} onValueChange={(v) => handleInputChange('type_journal', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPE_JOURNAL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                  <div className="space-y-4">
                    <div><Label>Total HT *</Label><Input type="number" step="0.01" value={extractedData.total_ht} onChange={(e) => handleInputChange('total_ht', e.target.value)} /></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><Label>TVA 7%</Label><Input type="number" step="0.01" value={extractedData.tva_7} onChange={(e) => handleInputChange('tva_7', e.target.value)} /></div>
                      <div><Label>TVA 13%</Label><Input type="number" step="0.01" value={extractedData.tva_13} onChange={(e) => handleInputChange('tva_13', e.target.value)} /></div>
                      <div><Label>TVA 19%</Label><Input type="number" step="0.01" value={extractedData.tva_19} onChange={(e) => handleInputChange('tva_19', e.target.value)} /></div>
                    </div>
                    <div><Label>Total TVA</Label><Input type="number" step="0.01" value={extractedData.total_tva} onChange={(e) => handleInputChange('total_tva', e.target.value)} /></div>
                    <div><Label>Remise</Label><Input type="number" step="0.01" value={extractedData.remise} onChange={(e) => handleInputChange('remise', e.target.value)} /></div>
                    <div><Label>Timbre fiscal</Label><Input type="number" step="0.01" value={extractedData.timbre_fiscal} onChange={(e) => handleInputChange('timbre_fiscal', e.target.value)} /></div>
                    <div><Label>Total TTC</Label><Input type="number" step="0.01" value={extractedData.total_ttc} onChange={(e) => handleInputChange('total_ttc', e.target.value)} className="font-semibold" /></div>
                  </div>
                </div>
              )}

              {/* Journal bancaire */}
              {extractedJournalBanqueData && (
                <div className="space-y-4 pt-6 border-t">
                  <h4 className="text-lg font-semibold flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                    Journal Bancaire
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Date du journal</Label>
                      <Input
                        type="date"
                        value={extractedJournalBanqueData.date || new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setExtractedJournalBanqueData({ ...extractedJournalBanqueData, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Numéro de compte *</Label>
                      <Input
                        type="text"
                        value={extractedJournalBanqueData.numero_compte || ''}
                        onChange={(e) => setExtractedJournalBanqueData({ ...extractedJournalBanqueData, numero_compte: e.target.value })}
                        placeholder="Ex: 532100001234567"
                      />
                    </div>
                    <div>
                      <Label>Titulaire du compte</Label>
                      <Input
                        type="text"
                        value={extractedJournalBanqueData.titulaire || ''}
                        onChange={(e) => setExtractedJournalBanqueData({ ...extractedJournalBanqueData, titulaire: e.target.value })}
                        placeholder="Nom du titulaire"
                      />
                    </div>
                  </div>

                  {/* Tableau des mouvements bancaires */}
                  {extractedJournalBanqueData.mouvements && extractedJournalBanqueData.mouvements.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-md font-semibold text-gray-700">Mouvements du relevé</h5>
                        <span className="text-sm text-gray-500">
                          {extractedJournalBanqueData.mouvements.length} mouvement(s)
                        </span>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                          <table className="w-full">
                            <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Libellé</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Débit</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Crédit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {extractedJournalBanqueData.mouvements.map((mouvement, index) => (
                                <tr key={index} className="border-t hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm text-gray-700">
                                    {mouvement.date}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-700">
                                    {mouvement.libelle}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right text-gray-700">
                                    {mouvement.debit > 0 ? formatCurrency(mouvement.debit) : '-'}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right text-gray-700">
                                    {mouvement.credit > 0 ? formatCurrency(mouvement.credit) : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 font-semibold">
                              <tr>
                                <td colSpan={2} className="px-4 py-2 text-sm text-gray-700">Total</td>
                                <td className="px-4 py-2 text-sm text-right text-gray-700">
                                  {formatCurrency(extractedJournalBanqueData.mouvements.reduce((sum, m) => sum + (m.debit || 0), 0))}
                                </td>
                                <td className="px-4 py-2 text-sm text-right text-gray-700">
                                  {formatCurrency(extractedJournalBanqueData.mouvements.reduce((sum, m) => sum + (m.credit || 0), 0))}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                        💡 Ces mouvements ont été extraits automatiquement du relevé bancaire par Gemini AI
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Écritures comptables */}
              {ecrituresComptables.length > 0 && (
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold flex items-center"><Calculator className="w-5 h-5 mr-2 text-green-600" />🇹🇳 Écritures comptables</h4>
                    <div className="flex items-center space-x-2">
                      <div>
                        <Label className="text-xs text-gray-600">Date écriture</Label>
                        <Input
                          type="date"
                          value={extractedData?.date || extractedJournalBanqueData?.date || new Date().toISOString().slice(0, 10)}
                          onChange={(e) => {
                            if (extractedData) {
                              handleInputChange('date', e.target.value);
                            } else if (extractedJournalBanqueData) {
                              setExtractedJournalBanqueData({ ...extractedJournalBanqueData, date: e.target.value });
                            }
                          }}
                          className="w-40"
                        />
                      </div>
                      <Button onClick={handleAddEcriture} size="sm" variant="outline" className="mt-5"><Plus className="w-4 h-4" /><span className="ml-1">Ajouter</span></Button>
                      {getTotalDebit() === getTotalCredit() ? <div className="flex items-center text-green-600 mt-5"><CheckCircle className="w-4 h-4 mr-1" /><span className="text-sm">Équilibrée</span></div> : <div className="flex items-center text-red-600 mt-5"><AlertCircle className="w-4 h-4 mr-1" /><span className="text-sm">Déséquilibrée</span></div>}
                    </div>
                  </div>
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
                                <Select value={e.num_compte} onValueChange={(v) => handleEditEcriture(i, 'num_compte', v)}>
                                  <SelectTrigger><SelectValue placeholder="Compte" /></SelectTrigger>
                                  <SelectContent>{planComptable.map(c => <SelectItem key={c.id} value={c.num_compte}>{c.num_compte} - {c.libelle}</SelectItem>)}</SelectContent>
                                </Select>
                              ) : <span className="font-mono text-sm">{e.num_compte}</span>}
                            </td>
                            <td className="px-2 py-2"><span className="text-sm">{e.libelle}</span></td>
                            <td className="px-2 py-2">
                              {editingIndex === i ? <Input type="number" step="0.001" value={e.debit} onChange={(ev) => handleEditEcriture(i, 'debit', ev.target.value)} className="text-right" /> : <span className="text-right text-sm block">{e.debit > 0 ? formatCurrency(e.debit) : '-'}</span>}
                            </td>
                            <td className="px-2 py-2">
                              {editingIndex === i ? <Input type="number" step="0.001" value={e.credit} onChange={(ev) => handleEditEcriture(i, 'credit', ev.target.value)} className="text-right" /> : <span className="text-right text-sm block">{e.credit > 0 ? formatCurrency(e.credit) : '-'}</span>}
                            </td>
                            <td className="px-2 py-2">
                              <div className="flex justify-center space-x-1">
                                {editingIndex === i ? (
                                  <Button size="sm" variant="outline" onClick={() => setEditingIndex(null)} className="h-8 w-8 p-0"><CheckCircle className="w-4 h-4" /></Button>
                                ) : (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => setEditingIndex(i)} className="h-8 w-8 p-0"><Edit2 className="w-4 h-4" /></Button>
                                    <Button size="sm" variant="outline" onClick={() => handleDeleteEcriture(i)} className="h-8 w-8 p-0 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t bg-slate-50 font-semibold">
                          <td colSpan={2} className="px-4 py-2 text-sm">Total</td>
                          <td className="px-4 py-2 text-right text-sm">{formatCurrency(getTotalDebit())}</td>
                          <td className="px-4 py-2 text-right text-sm">{formatCurrency(getTotalCredit())}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="text-sm text-slate-600 space-y-2">
                    <p>Total Débit: {formatCurrency(getTotalDebit())} | Total Crédit: {formatCurrency(getTotalCredit())}
                      {getTotalDebit() !== getTotalCredit() && <span className="text-red-600 ml-2">(Différence: {formatCurrency(Math.abs(getTotalDebit() - getTotalCredit()))})</span>}
                    </p>
                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                      <p className="text-violet-800 text-xs">✨ <strong>Génération intelligente :</strong> Gemini a analysé l'image de votre facture ET utilisé votre plan comptable pour sélectionner automatiquement les comptes appropriés selon les normes tunisiennes. <strong>Extraction et écritures en un seul appel</strong> pour une vitesse optimale.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={handleClose} disabled={isLoading}>Annuler</Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Enregistrement...' : extractedJournalBanqueData ? 'Enregistrer le journal banque' : 'Enregistrer la facture'}
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200">
              <h4 className="text-lg font-semibold p-4 bg-gray-800 text-white flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Aperçu du document
              </h4>
              {imageUrl ? (
                <div className="p-6">
                  {fileType === 'pdf' ? (
                    <div className="w-full min-h-[700px] max-h-[800px]">
                      <iframe
                        src={imageUrl}
                        className="w-full h-[700px] border rounded"
                        title={selectedFile?.name || 'facture.pdf'}
                      />
                      <div className="mt-2 text-center">
                        <a
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ouvrir le PDF dans un nouvel onglet
                        </a>
                      </div>
                    </div>
                  ) : (
                    <ImageZoom imageUrl={imageUrl} className="w-full h-auto min-h-[700px] max-h-[800px]" />
                  )}
                </div>
              ) : (
                <div className="h-[700px] flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-600 mx-auto mb-6"></div>
                    <p className="text-lg font-medium">Chargement du document...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}