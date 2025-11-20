'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UnifiedJournalTable } from '@/components/tables/unified-journal-table';
import { ArrowLeft, Search, Users, Scan, Eye, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ClientStats } from '@/components/client-stats';
import { JournalTypeFilterButtons } from '@/components/journal-type-filter-buttons';
import { EditFactureModal } from '@/components/modals/edit-facture-modal';
import { EditJournalBanqueModal } from '@/components/modals/edit-journal-banque-modal';
import { ScanFactureModal } from '@/components/modals/scan-facture-modal';
import type { Facture, JournalVente, JournalBanque } from '@/lib/types';
import { SimpleFilters } from '@/components/simple-filters';
import { 
  filterJournals, 
  formatDate, 
  getStatusBadge, 
  getJournalTypeFromFacture,
  type JournalEntry,
  type JournalType,
  type Filters
} from '@/lib/comptable-utils';

interface Client {
  uid: string; nom: string; societe: string; email: string | null; statut: string | null; date_inscription: bigint | null;
}

const API_ROUTES = {
  CLIENTS: '/api/comptable-actions/clients',
  ACHAT: (uid: string) => `/api/journal-achat?clientUid=${uid}`,
  VENTE: (uid: string) => `/api/journal-vente?clientUid=${uid}`,
  BANQUE: (uid: string) => `/api/journal-banque?clientUid=${uid}`,
  DELETE_FACTURE: (id: string) => `/api/comptable-actions/factures/${id}`,
  DELETE_JOURNAL_VENTE: (id: string) => `/api/comptable-actions/journal-vente/${id}`,
  DELETE_JOURNAL_BANQUE: (id: string) => `/api/comptable-actions/journal-banque/${id}`,
  GENERATE: '/api/ecritures/generate-fast',
};

// Composant pour le badge de statut
const StatusBadge = ({ statut }: { statut: string | null }) => {
  const [text, className] = getStatusBadge(statut);
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{text}</span>;
};


// --- Composant Principal ---

export default function AdminFacturesPage() {
  const [view, setView] = useState<'clients' | 'client'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Utilisation d'un seul objet pour les journaux bruts (optimisation)
  const [journals, setJournals] = useState<{ Achat: Facture[]; Vente: JournalVente[]; Banque: JournalBanque[] }>({ 
    Achat: [], Vente: [], Banque: [] 
  });
  
  const [isLoading, setIsLoading] = useState({ clients: true, factures: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>({ search: '', status: 'ALL', yearMonth: '' });
  const [selectedTypeJournal, setSelectedTypeJournal] = useState<JournalType>('J_ACH');

  const [modals, setModals] = useState({ 
    scan: false, 
    edit: false, 
    editBanque: false,
    editingFacture: null as Facture | null,
    editingJournalBanque: null as JournalBanque | null
  });
  const [generatingEcritures, setGeneratingEcritures] = useState<string | null>(null);
  const { toast } = useToast();

  const setIsLoadingState = (key: 'clients' | 'factures', value: boolean) => 
    setIsLoading(prev => ({ ...prev, [key]: value }));

  // --- Effets de chargement initial ---

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingState('clients', true);
      try {
        const response = await fetch(API_ROUTES.CLIENTS);
        if (response.ok) {
          setClients(await response.json());
        } else {
          toast({ title: 'Erreur', description: 'Impossible de charger les clients', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Erreur', description: 'Erreur de connexion', variant: 'destructive' });
      } finally {
        setIsLoadingState('clients', false);
      }
    };
    fetchClients();
  }, [toast]);

  const fetchClientFactures = useCallback(async (clientUid: string) => {
    setIsLoadingState('factures', true);
    try {
      // Exécute les appels API en parallèle
      const [resAchat, resVente, resBanque] = await Promise.all([
        fetch(API_ROUTES.ACHAT(clientUid)),
        fetch(API_ROUTES.VENTE(clientUid)),
        fetch(API_ROUTES.BANQUE(clientUid)),
      ]);

      const [dataAchat, dataVente, dataBanque] = await Promise.all([
        resAchat.ok ? resAchat.json() : [],
        resVente.ok ? resVente.json() : [],
        resBanque.ok ? resBanque.json().then((r: any) => r.success ? r.data : r) : [],
      ]);

      setJournals({ Achat: dataAchat, Vente: dataVente, Banque: dataBanque });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur de connexion lors du chargement des documents', variant: 'destructive' });
    } finally {
      setIsLoadingState('factures', false);
    }
  }, [toast]);
  
  // --- Gestion des filtres et des journaux filtrés (Memoization pour la performance) ---

  const filteredJournals = useMemo(() => {
    return {
      Achat: filterJournals(journals.Achat, filters, ['fournisseur', 'reference']),
      Vente: filterJournals(journals.Vente, filters, ['clientdefacture', 'reference']),
      Banque: filterJournals(journals.Banque, filters, ['importateur_exportateur', 'numero']),
    };
  }, [journals, filters]);

  const allJournals = useMemo(() => {
    const achats = journals.Achat.map(j => ({ ...j, type_journal: 'J_ACH' as const }));
    const ventes = journals.Vente.map(j => ({ ...j, type_journal: 'J_VTE' as const }));
    const banques = journals.Banque.map(j => ({ ...j, type_journal: 'J_BQ' as const }));
    return [...achats, ...ventes, ...banques];
  }, [journals]);

  const currentJournalData = useMemo(() => {
    switch (selectedTypeJournal) {
      case 'J_ACH': return filteredJournals.Achat;
      case 'J_VTE': return filteredJournals.Vente;
      case 'J_BQ': return filteredJournals.Banque;
      default: return [];
    }
  }, [selectedTypeJournal, filteredJournals]);

  const filteredClients = useMemo(() => 
    clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.societe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [clients, searchTerm]);

  // --- Gestion des actions et des mises à jour d'état ---

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setView('client');
    fetchClientFactures(client.uid);
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    setJournals({ Achat: [], Vente: [], Banque: [] });
    setView('clients');
    setModals({ scan: false, edit: false, editBanque: false, editingFacture: null, editingJournalBanque: null });
  };

  const resetFilters = () => {
    setFilters({ search: '', status: 'ALL', yearMonth: '' });
    setSelectedTypeJournal('J_ACH');
  };

  // Fonction générique pour mettre à jour l'état du journal
  const updateJournalState = useCallback((
    newFacture: Facture, 
    action: 'ADD' | 'UPDATE' | 'DELETE'
  ) => {
    const journalType = getJournalTypeFromFacture(newFacture);
    const key = journalType === 'J_VTE' ? 'Vente' : (journalType === 'J_BQ' ? 'Banque' : 'Achat');
    
    setJournals(prev => {
      const list = prev[key as keyof typeof prev] as Facture[];
      let updatedList: Facture[];

      if (action === 'ADD') {
        updatedList = [newFacture, ...list];
      } else if (action === 'UPDATE') {
        updatedList = list.map(f => f.id === newFacture.id ? newFacture : f);
      } else { // DELETE
        updatedList = list.filter(f => f.id !== newFacture.id);
      }

      return { ...prev, [key]: updatedList };
    });
  }, []);

  const handleFactureAdded = (newFacture: Facture) => {
    updateJournalState(newFacture, 'ADD');
    setModals(p => ({ ...p, scan: false }));
  };

  const handleEditFacture = (facture: Facture | JournalBanque) => {
    // Vérifier si c'est un journal banque
    const isJournalBanque = 'numero_compte' in facture && 'titulaire' in facture;
    
    if (isJournalBanque) {
      setModals(p => ({ ...p, editBanque: true, editingJournalBanque: facture as JournalBanque }));
    } else {
      if (facture.status === 'VALIDATED') {
        toast({ title: 'Action non autorisée', description: 'Impossible de modifier une facture validée', variant: 'destructive' });
        return;
      }
      setModals(p => ({ ...p, edit: true, editingFacture: facture as Facture }));
    }
  };

  const handleFactureUpdated = (updatedFacture: Facture) => {
    updateJournalState(updatedFacture, 'UPDATE');
    setModals(p => ({ ...p, edit: false, editingFacture: null }));
  };

  const handleJournalBanqueUpdated = (updatedJournal: JournalBanque) => {
    setJournals(prev => ({
      ...prev,
      Banque: prev.Banque.map(j => j.id === updatedJournal.id ? updatedJournal : j)
    }));
    setModals(p => ({ ...p, editBanque: false, editingJournalBanque: null }));
  };

  const generateEcrituresForFacture = useCallback(async (facture: JournalEntry) => {
    setGeneratingEcritures(facture.id);

    try {
      const factureData = facture as Facture;
      const bodyData = {
        factureId: facture.id,
        factureData: {
          fournisseur: factureData.fournisseur || '',
          type_journal: factureData.type_journal,
          total_ht: factureData.total_ht,
          total_tva: factureData.total_tva,
          total_ttc: factureData.total_ttc,
          reference: factureData.reference,
          date: factureData.date
        },
        options: { useGemini: true, maxRetries: 2, timeout: 5000 }
      };

      const response = await fetch(API_ROUTES.GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        const result = await response.json();
        const updatedFacture = { ...facture, status: 'COMPTABILISE' } as Facture; 
        updateJournalState(updatedFacture, 'UPDATE');
        
        toast({
          title: 'Succès',
          description: `Écritures générées avec ${result.metadata.method} en ${result.metadata.generationTime}ms`,
        });
      } else {
        const error = await response.json();
        toast({ title: 'Erreur', description: error.error || 'Erreur lors de la génération des écritures', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur de connexion lors de la génération', variant: 'destructive' });
    } finally {
      setGeneratingEcritures(null);
    }
  }, [toast, updateJournalState]);

  const generateAllEcritures = async () => {
    const pendingItems = currentJournalData.filter(f => f.status === 'PENDING' || f.status === 'VALIDATED');
    
    if (pendingItems.length === 0) {
      toast({ title: 'Information', description: 'Aucun document en attente de traitement' });
      return;
    }

    if (!confirm(`Générer les écritures pour ${pendingItems.length} document(s) en attente ?`)) return;

    let successCount = 0;
    let errorCount = 0;

    for (const item of pendingItems) {
      try {
        await generateEcrituresForFacture(item); 
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        errorCount++;
      }
    }

    toast({ title: 'Génération terminée', description: `${successCount} succès, ${errorCount} erreurs` });
  };

  const handleDeleteFacture = async (id: string) => {
    try {
      // Trouver le document à supprimer pour déterminer son type
      const document = [...journals.Achat, ...journals.Vente, ...journals.Banque].find(f => f.id === id);
      if (!document) {
        toast({ title: 'Erreur', description: 'Document non trouvé', variant: 'destructive' });
        return;
      }

      // Déterminer la route API et le type selon le document
      let deleteRoute: string;
      let journalKey: 'Achat' | 'Vente' | 'Banque';
      
      if (journals.Banque.some(j => j.id === id)) {
        deleteRoute = API_ROUTES.DELETE_JOURNAL_BANQUE(id);
        journalKey = 'Banque';
      } else if (journals.Vente.some(j => j.id === id)) {
        deleteRoute = API_ROUTES.DELETE_JOURNAL_VENTE(id);
        journalKey = 'Vente';
      } else {
        deleteRoute = API_ROUTES.DELETE_FACTURE(id);
        journalKey = 'Achat';
      }

      const response = await fetch(deleteRoute, { method: 'DELETE' });

      if (response.ok) {
        // Supprimer directement du bon tableau
        setJournals(prev => ({
          ...prev,
          [journalKey]: prev[journalKey].filter(j => j.id !== id)
        }));
        toast({ title: 'Succès', description: 'Document supprimé avec succès' });
      } else {
        const error = await response.json();
        toast({ title: 'Erreur', description: error.error || 'Erreur lors de la suppression', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur de connexion', variant: 'destructive' });
    }
  };


  // --- Rendu des Vues ---

  // Vue liste des clients
  if (view === 'clients') {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Gestion des Factures</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">Sélectionnez un client pour gérer ses factures</p>
          </div>
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center text-base sm:text-lg font-semibold text-slate-800">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Liste des Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>

            {isLoading.clients ? (
              <div className="space-y-3 sm:space-y-4">{[...Array(3)].map((_, i) => (<div key={i} className="h-16 sm:h-20 bg-slate-100 rounded animate-pulse"></div>))}</div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-slate-500 text-sm sm:text-base">
                    {searchTerm ? 'Aucun client trouvé' : 'Aucun client disponible'}
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.uid}
                      className="border border-slate-200 rounded-lg p-3 sm:p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900">{client.nom}</h3>
                            <StatusBadge statut={client.statut} />
                          </div>
                          <p className="text-sm sm:text-base text-slate-600 mt-1">{client.societe}</p>
                          {client.email && (<p className="text-xs sm:text-sm text-slate-500 mt-1 break-all">{client.email}</p>)}
                          <p className="text-xs text-slate-400 mt-2">Inscrit le: {formatDate(client.date_inscription)}</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
                          <span className="hidden sm:inline">Voir les factures</span>
                          <span className="sm:hidden">Voir</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">Total: {filteredClients.length} client(s)</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vue factures du client sélectionné
  if (view === 'client' && selectedClient) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header avec bouton retour et titre */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Button 
              variant="outline" 
              onClick={handleBackToClients} 
              className="flex items-center w-full sm:w-auto text-sm"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                Factures de {selectedClient.nom}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1">{selectedClient.societe}</p>
            </div>
          </div>
          
          {/* Boutons d'action - Stack sur mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
            <Button 
              onClick={generateAllEcritures} 
              variant="outline" 
              className="flex items-center justify-center space-x-1 text-xs sm:text-sm w-full sm:w-auto" 
              disabled={isLoading.factures}
              size="sm"
            >
              <Brain className="w-4 h-4" /> 
              <span className="hidden sm:inline">Générer toutes les écritures</span>
              <span className="sm:hidden">Générer tout</span>
            </Button>
            <Button 
              onClick={() => setModals(p => ({ ...p, scan: true }))} 
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm w-full sm:w-auto"
              size="sm"
            >
              <Scan className="w-4 h-4 mr-2" /> 
              <span className="hidden sm:inline">Scanner une facture</span>
              <span className="sm:hidden">Scanner</span>
            </Button>
          </div>
        </div>

        <ClientStats
          clientUid={selectedClient.uid}
          clientName={selectedClient.nom}
          factures={allJournals}
        />

        <JournalTypeFilterButtons
          factures={allJournals}
          selectedType={selectedTypeJournal}
          onTypeSelect={(type: string) => setSelectedTypeJournal(type as JournalType)}
        />

        <SimpleFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg font-semibold text-slate-800">
              Documents de {selectedClient.nom} ({currentJournalData.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <UnifiedJournalTable
              journauxAchat={filteredJournals.Achat as Facture[]}
              journauxVente={filteredJournals.Vente as JournalVente[]}
              journauxBanque={filteredJournals.Banque as JournalBanque[]}
              selectedType={selectedTypeJournal}
              isLoading={isLoading.factures}
              showClient={false}
              onEdit={handleEditFacture}
              onDelete={handleDeleteFacture}
              showActions={true}
              onJournalUpdated={() => selectedClient && fetchClientFactures(selectedClient.uid)}
              onGenerateEcritures={generateEcrituresForFacture}
              generatingEcritures={generatingEcritures}
            />
          </CardContent>
        </Card>

        {/* Modals */}
        <ScanFactureModal
          isOpen={modals.scan}
          onClose={() => setModals(p => ({ ...p, scan: false }))}
          clientUid={selectedClient.uid}
          clientName={selectedClient.nom}
          onFactureAdded={handleFactureAdded}
        />

        <EditFactureModal
          isOpen={modals.edit}
          onClose={() => setModals(p => ({ ...p, edit: false, editingFacture: null }))}
          facture={modals.editingFacture}
          onFactureUpdated={handleFactureUpdated}
        />

        <EditJournalBanqueModal
          isOpen={modals.editBanque}
          onClose={() => setModals(p => ({ ...p, editBanque: false, editingJournalBanque: null }))}
          journal={modals.editingJournalBanque}
          onJournalUpdated={handleJournalBanqueUpdated}
        />
      </div>
    );
  }

  return null;
}