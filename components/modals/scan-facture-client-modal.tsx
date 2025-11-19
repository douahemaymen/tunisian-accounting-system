'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { extractInvoiceAndGenerateEntries } from '@/lib/gemini';
import { JournalTypeSelection } from './journal-type-selection';
import { Spinner } from '@/components/ui/spinner';

const TYPE_JOURNAL_OPTIONS = [
  { value: 'J_ACH', label: 'Journal d\'Achat' },
  { value: 'J_VTE', label: 'Journal de Vente' },
  { value: 'J_BQ', label: 'Journal de Banque' },
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

export function ScanFactureClientModal({ isOpen, onClose, clientUid, clientName, onFactureAdded }) {
  const [step, setStep] = useState('journal-type');
  const [selectedJournalType, setSelectedJournalType] = useState(null);
  const [selectedFactureType, setSelectedFactureType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileType, setFileType] = useState('image');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetModal = () => {
    setStep('journal-type');
    setSelectedJournalType(null);
    setSelectedFactureType(null);
    setSelectedFile(null);
    setUploadProgress(0);
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

  const handleScanAndSave = async () => {
    if (!selectedFile || !selectedJournalType) return;

    setStep('loading');
    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Étape 1: Upload vers Cloudinary
      setUploadProgress(20);
      toast({ title: 'Upload en cours', description: `Upload du ${fileType === 'pdf' ? 'PDF' : 'image'} vers Cloudinary...` });

      const uploadResult = await uploadImageToCloudinary(selectedFile);
      const imageUrl = uploadResult.secure_url || uploadResult.url;
      setUploadProgress(40);

      // Étape 2: Chargement du plan comptable
      setUploadProgress(50);
      toast({ title: 'Chargement du plan comptable', description: 'Récupération des comptes comptables...' });

      const planComptableResponse = await fetch('/api/plancomptable');
      const planComptableData = await planComptableResponse.json();
      setUploadProgress(60);

      // Étape 3: Extraction et génération des écritures
      toast({ title: 'Analyse intelligente en cours', description: 'Extraction des données ET génération des écritures comptables...' });

      const result = await extractInvoiceAndGenerateEntries(selectedFile, planComptableData, selectedJournalType);
      setUploadProgress(80);

      // Étape 4: Enregistrement automatique avec écritures
      const apiUrl = '/api/client-factures'; // Endpoint unifié pour les clients
      let extractedData;
      let journalType = 'achat'; // Par défaut

      if (selectedJournalType === 'J_BQ') {
        journalType = 'banque';
        const resultData = result.facture as any;
        extractedData = {
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
        };
      } else if (selectedJournalType === 'J_VTE') {
        journalType = 'vente';
        const factureData: any = result.facture;
        extractedData = {
          clientdefacture: factureData.clientdefacture || factureData.fournisseur || 'Client non détecté',
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
          type_facture: selectedFactureType || 'VENTE_ORDINAIRE_DT'
        };
      } else {
        const factureData: any = result.facture;
        extractedData = {
          fournisseur: factureData.fournisseur || 'Fournisseur non détecté',
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
          type_facture: selectedFactureType || 'FACTURE_ORDINAIRE_DT'
        };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUid,
          imageUrl,
          extractedData,
          ecrituresComptables: result.ecritures, // Inclure les écritures générées
          journalType
        })
      });

      if (response.ok) {
        const savedDocument = await response.json();
        
        setUploadProgress(100);
        toast({
          title: '✅ Document enregistré !',
          description: `Document analysé et enregistré avec ${result.ecritures.length} écriture(s) comptable(s). Status: COMPTABILISÉ`
        });
        onFactureAdded(savedDocument);
        handleClose();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'enregistrement');
      }

    } catch (error) {
      console.error('Erreur lors du scan:', error);
      
      let errorMessage = error.message || 'Erreur lors du scan de la facture';
      let errorTitle = 'Erreur';
      
      if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE')) {
        errorTitle = 'Service temporairement indisponible';
        errorMessage = 'L\'API Gemini est surchargée. Veuillez réessayer dans quelques instants.';
      } else if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        errorTitle = 'Limite de requêtes atteinte';
        errorMessage = 'Vous avez atteint la limite de requêtes. Veuillez patienter quelques minutes.';
      }
      
      toast({ title: errorTitle, description: errorMessage, variant: 'destructive' });
      setStep('upload');
    } finally {
      setIsLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const factureTypeOptions = selectedJournalType === 'J_ACH' ? TYPE_FACTURE_ACHAT : TYPE_FACTURE_VENTE;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Scanner une facture pour {clientName}
            {selectedJournalType && (
              <span className="text-xs sm:text-sm font-normal text-gray-600 ml-2 block sm:inline mt-1 sm:mt-0">
                ({TYPE_JOURNAL_OPTIONS.find(t => t.value === selectedJournalType)?.label})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Étape 1: Sélection du type de journal */}
        {step === 'journal-type' && <JournalTypeSelection onSelect={handleJournalTypeSelect} />}

        {/* Étape 2: Sélection du type de facture */}
        {step === 'facture-type' && (
          <div className="p-3 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Sélectionnez le type de facture</h3>
              <p className="text-sm sm:text-base text-gray-600">Choisissez le type de facture correspondant à votre document</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {factureTypeOptions.map((type) => (
                <div 
                  key={type.value} 
                  className="cursor-pointer p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-lg transition-all duration-200 active:scale-95 sm:hover:scale-105" 
                  onClick={() => handleFactureTypeSelect(type.value)}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg text-white ${selectedJournalType === 'J_ACH' ? 'bg-blue-500' : 'bg-green-500'}`}>
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="text-sm sm:text-lg font-medium">{type.label}</h4>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setStep('journal-type')}>
                <X className="w-4 h-4 mr-2" />Retour
              </Button>
            </div>
          </div>
        )}

        {/* Étape 3: Upload du fichier */}
        {step === 'upload' && (
          <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
            <div className="text-center mb-4">
              <h4 className="text-lg sm:text-xl font-semibold mb-2 text-gray-800">Sélectionnez votre document</h4>
              <p className="text-sm sm:text-base text-gray-600">Le document sera analysé et enregistré automatiquement</p>
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
              <Button 
                variant="outline" 
                onClick={() => setStep((selectedJournalType === 'J_ACH' || selectedJournalType === 'J_VTE') ? 'facture-type' : 'journal-type')}
              >
                <X className="w-4 h-4 mr-2" />Retour
              </Button>
              <Button onClick={handleScanAndSave} disabled={!selectedFile}>
                <Upload className="w-4 h-4 mr-2" />Analyser et enregistrer
              </Button>
            </div>
          </div>
        )}

        {/* Étape 4: Chargement */}
        {step === 'loading' && (
          <div className="space-y-6 py-12">
            <div className="text-center">
              <Spinner text="Analyse et enregistrement automatique..." size="lg" />
              <div className="mt-6">
                <Progress value={uploadProgress} className="h-3 max-w-md mx-auto" />
                <div className="text-sm text-slate-600 mt-2">{uploadProgress}%</div>
                <div className="text-xs text-slate-500 mt-1">
                  {uploadProgress < 30 && "📤 Upload du document..."}
                  {uploadProgress >= 30 && uploadProgress < 70 && "🤖 Extraction avec IA Gemini..."}
                  {uploadProgress >= 70 && "💾 Enregistrement automatique..."}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
