'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Search, FileText, Calculator, ArrowLeft, Users, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EcrituresStats from '@/components/ecritures-stats';
import { JournalTypeFilterButtons } from '@/components/journal-type-filter-buttons';
import { EcrituresFilters } from '@/components/ecritures-filters';
import { Badge } from '@/components/ui/badge';
import { formatTND } from '@/lib/currency-utils';
import { exportEcrituresToExcel, exportEcrituresByJournal } from '@/lib/excel-export';



interface EcritureComptable {
  id: string;
  date: string;
  libelle: string;
  debit: number;
  credit: number;
  facture?: {
    id: string;
    reference: string;
    type_facture: string;
    fournisseur: string;
    total_ttc: number;
    client: {
      nom: string;
      societe: string;
    };
  } | null;
  factureVente?: {
    id: string;
    reference: string;
    type_facture: string;
    clientdefacture: string;
    total_ttc: number;
    client: {
      nom: string;
      societe: string;
    };
  } | null;
  journalBanque?: {
    id: string;
    date: string;
    numero_compte: string;
    titulaire: string;
    client: {
      nom: string;
      societe: string;
    };
  } | null;
  planComptable: {
    num_compte: string;
    libelle: string;
    type_compte: string | null;
  };
}

interface PlanComptable {
  id: string;
  num_compte: string;
  libelle: string;
  type_compte: string | null;
}

interface Client {
  uid: string;
  nom: string;
  societe: string;
  email: string | null;
  statut: string | null;
  date_inscription: bigint | null;
}

export default function EcrituresComptablesPage() {
  const [view, setView] = useState<'clients' | 'ecritures'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [ecritures, setEcritures] = useState<EcritureComptable[]>([]);
  const [planComptable, setPlanComptable] = useState<PlanComptable[]>([]);
  const [loading, setLoading] = useState({ clients: true, ecritures: false, factures: false, generating: false });
  const [selectedTypeJournal, setSelectedTypeJournal] = useState('J_ACH');
  const [facturesNonComptabilisees, setFacturesNonComptabilisees] = useState<any[]>([]);
  const [yearMonth, setYearMonth] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEcriture, setEditingEcriture] = useState<EcritureComptable | null>(null);
  const [formData, setFormData] = useState({
    libelle: '',
    debit: '',
    credit: '',
    planId: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
    fetchPlanComptable();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/comptable-actions/clients');
      if (response.ok) {
        setClients(await response.json());
      } else {
        toast({ title: 'Erreur', description: 'Impossible de charger les clients', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur de connexion', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setView('ecritures');
    fetchEcrituresForClient(client.uid);
    fetchFacturesNonComptabilisees(client.uid);
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
    setEcritures([]);
    setView('clients');
  };

  const fetchEcrituresForClient = async (clientUid: string) => {
    setLoading(prev => ({ ...prev, ecritures: true }));
    try {
      const response = await fetch(`/api/ecritures-comptables?clientUid=${clientUid}`);
      if (response.ok) {
        const data = await response.json();
        setEcritures(Array.isArray(data) ? data : []);
      } else {
        toast({ title: 'Erreur', description: 'Impossible de charger les écritures', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur de connexion', variant: 'destructive' });
    } finally {
      setLoading(prev => ({ ...prev, ecritures: false }));
    }
  };

  const fetchPlanComptable = async () => {
    try {
      const response = await fetch('/api/plancomptable');
      if (response.ok) {
        const data = await response.json();
        setPlanComptable(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du plan comptable:', error);
    }
  };

  const fetchFacturesNonComptabilisees = async (clientUid: string) => {
    setLoading(prev => ({ ...prev, factures: true }));
    try {
      // Récupérer les factures d'achat non comptabilisées
      const [achatRes, venteRes] = await Promise.all([
        fetch(`/api/journal-achat?clientUid=${clientUid}&status=NON_COMPTABILISE`),
        fetch(`/api/journal-vente?clientUid=${clientUid}&status=NON_COMPTABILISE`)
      ]);

      const facturesAchat = achatRes.ok ? await achatRes.json() : [];
      const facturesVente = venteRes.ok ? await venteRes.json() : [];

      // Combiner et marquer le type
      const allFactures = [
        ...facturesAchat.map((f: any) => ({ ...f, journal_type: 'J_ACH' })),
        ...facturesVente.map((f: any) => ({ ...f, journal_type: 'J_VTE' }))
      ];

      setFacturesNonComptabilisees(allFactures);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    } finally {
      setLoading(prev => ({ ...prev, factures: false }));
    }
  };

  const handleGenerateEcritures = async (factureId: string, factureReference: string) => {
    setLoading(prev => ({ ...prev, generating: true }));
    try {
      const response = await fetch('/api/ecritures-comptables/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factureId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Succès',
          description: result.message,
        });
        
        // Rafraîchir les données
        if (selectedClient) {
          fetchEcrituresForClient(selectedClient.uid);
          fetchFacturesNonComptabilisees(selectedClient.uid);
        }
      } else {
        toast({
          title: 'Erreur',
          description: result.error || 'Erreur lors de la génération des écritures',
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
      setLoading(prev => ({ ...prev, generating: false }));
    }
  };

  const handleEdit = (ecriture: EcritureComptable) => {
    setEditingEcriture(ecriture);
    setFormData({
      libelle: ecriture.libelle,
      debit: ecriture.debit.toString(),
      credit: ecriture.credit.toString(),
      planId: ecriture.planComptable ? '' : '' // On garde le plan actuel
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingEcriture) return;

    if (!formData.libelle) {
      toast({
        title: 'Erreur',
        description: 'Le libellé est obligatoire',
        variant: 'destructive',
      });
      return;
    }

    const debit = parseFloat(formData.debit) || 0;
    const credit = parseFloat(formData.credit) || 0;

    if (debit < 0 || credit < 0) {
      toast({
        title: 'Erreur',
        description: 'Les montants ne peuvent pas être négatifs',
        variant: 'destructive',
      });
      return;
    }

    if (debit > 0 && credit > 0) {
      toast({
        title: 'Erreur',
        description: 'Une écriture ne peut pas avoir à la fois un débit et un crédit',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/ecritures-comptables/${editingEcriture.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          libelle: formData.libelle,
          debit: debit,
          credit: credit,
          ...(formData.planId && { planId: formData.planId })
        }),
      });

      if (response.ok) {
        const updatedEcriture = await response.json();
        setEcritures(prev =>
          prev.map(e => e.id === updatedEcriture.id ? updatedEcriture : e)
        );

        toast({
          title: 'Succès',
          description: 'Écriture modifiée avec succès',
        });

        setIsEditDialogOpen(false);
        setEditingEcriture(null);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Une erreur est survenue',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette écriture comptable ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ecritures-comptables/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEcritures(prev => prev.filter(e => e.id !== id));
        toast({
          title: 'Succès',
          description: 'Écriture supprimée avec succès',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Impossible de supprimer cette écriture',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      libelle: '',
      debit: '',
      credit: '',
      planId: ''
    });
    setEditingEcriture(null);
  };

  // Fonction helper pour obtenir le type de journal
  const getJournalType = (ecriture: EcritureComptable): string => {
    if (ecriture.facture) return 'J_ACH';
    if (ecriture.factureVente) return 'J_VTE';
    if (ecriture.journalBanque) return 'J_BQ';
    return 'UNKNOWN';
  };

  // Fonction helper pour obtenir la référence
  const getReference = (ecriture: EcritureComptable): string => {
    if (ecriture.facture) return ecriture.facture.reference;
    if (ecriture.factureVente) return ecriture.factureVente.reference;
    if (ecriture.journalBanque) return ecriture.journalBanque.numero_compte;
    return 'N/A';
  };

  // Fonction helper pour obtenir le client
  const getClient = (ecriture: EcritureComptable) => {
    if (ecriture.facture) return ecriture.facture.client;
    if (ecriture.factureVente) return ecriture.factureVente.client;
    if (ecriture.journalBanque) return ecriture.journalBanque.client;
    return null;
  };

  // Fonction helper pour obtenir le type de facture
  const getTypeFacture = (ecriture: EcritureComptable): string => {
    if (ecriture.facture) return ecriture.facture.type_facture;
    if (ecriture.factureVente) return ecriture.factureVente.type_facture;
    if (ecriture.journalBanque) return 'Relevé Bancaire';
    return 'N/A';
  };

  // Fonction helper pour obtenir le fournisseur/client
  const getTiers = (ecriture: EcritureComptable): string => {
    if (ecriture.facture) return ecriture.facture.fournisseur;
    if (ecriture.factureVente) return ecriture.factureVente.clientdefacture;
    if (ecriture.journalBanque) return ecriture.journalBanque.titulaire;
    return 'N/A';
  };

  // Filtrage des écritures avec protection contre les erreurs
  const filteredEcritures = useMemo(() => ecritures.filter(ecriture => {
    try {
      const client = getClient(ecriture);
      if (!client || !ecriture.planComptable) return false;

      const searchLower = searchTerm.toLowerCase();
      const reference = getReference(ecriture);
      const tiers = getTiers(ecriture);
      
      const matchesSearch = !searchTerm || (
        ecriture.libelle?.toLowerCase().includes(searchLower) ||
        reference?.toLowerCase().includes(searchLower) ||
        client.nom?.toLowerCase().includes(searchLower) ||
        tiers?.toLowerCase().includes(searchLower) ||
        ecriture.planComptable.num_compte?.includes(searchTerm) ||
        ecriture.planComptable.libelle?.toLowerCase().includes(searchLower)
      );

      const matchesClient = !selectedClient || client.nom === selectedClient.nom;
      const journalType = getJournalType(ecriture);
      const matchesTypeJournal = !selectedTypeJournal || journalType === selectedTypeJournal;

      const matchesYearMonth = !yearMonth || (() => {
        const ecritureDate = new Date(ecriture.date);
        const ym = `${ecritureDate.getFullYear()}-${String(ecritureDate.getMonth() + 1).padStart(2, '0')}`;
        return ym === yearMonth;
      })();

      // Nouveau filtre par mois et année
      const matchesMonthYear = (() => {
        if (selectedMonth === 'ALL' && selectedYear === 'ALL') return true;
        const ecritureDate = new Date(ecriture.date);
        const month = String(ecritureDate.getMonth() + 1).padStart(2, '0');
        const year = ecritureDate.getFullYear().toString();
        
        const matchMonth = selectedMonth === 'ALL' || month === selectedMonth;
        const matchYear = selectedYear === 'ALL' || year === selectedYear;
        
        return matchMonth && matchYear;
      })();

      return matchesSearch && matchesClient && matchesTypeJournal && matchesYearMonth && matchesMonthYear;
    } catch {
      return false;
    }
  }), [ecritures, searchTerm, selectedClient, selectedTypeJournal, yearMonth, selectedMonth, selectedYear]);

  // Calculs des totaux avec memoization
  const { totalDebit, totalCredit } = useMemo(() => ({
    totalDebit: filteredEcritures.reduce((sum, e) => sum + (e.debit || 0), 0),
    totalCredit: filteredEcritures.reduce((sum, e) => sum + (e.credit || 0), 0),
  }), [filteredEcritures]);



  // Fonctions d'export Excel
  const handleExportExcel = () => {
    const ecrituresForExport = filteredEcritures.map(e => ({
      date: e.date,
      journal: getJournalType(e),
      reference: getReference(e),
      libelle: e.libelle,
      num_compte: e.planComptable?.num_compte || '',
      compte_libelle: e.planComptable?.libelle || '',
      debit: e.debit,
      credit: e.credit
    }));

    const monthLabel = selectedMonth === 'ALL' ? 'tous' : selectedMonth;
    const yearLabel = selectedYear === 'ALL' ? 'toutes' : selectedYear;
    const fileName = `ecritures-${monthLabel}-${yearLabel}.xlsx`;
    exportEcrituresToExcel(ecrituresForExport, fileName);
    
    toast({
      title: 'Export réussi',
      description: `${ecrituresForExport.length} écritures exportées vers Excel`
    });
  };

  const handleExportByJournal = () => {
    const ecrituresByJournal: { [key: string]: any[] } = {};
    
    filteredEcritures.forEach(e => {
      const journal = getJournalType(e);
      if (!ecrituresByJournal[journal]) {
        ecrituresByJournal[journal] = [];
      }
      ecrituresByJournal[journal].push({
        date: e.date,
        journal,
        reference: getReference(e),
        libelle: e.libelle,
        num_compte: e.planComptable?.num_compte || '',
        compte_libelle: e.planComptable?.libelle || '',
        debit: e.debit,
        credit: e.credit
      });
    });

    const monthLabel = selectedMonth === 'ALL' ? 'tous' : selectedMonth;
    const yearLabel = selectedYear === 'ALL' ? 'toutes' : selectedYear;
    const fileName = `ecritures-par-journal-${monthLabel}-${yearLabel}.xlsx`;
    exportEcrituresByJournal(ecrituresByJournal, fileName);
    
    toast({
      title: 'Export réussi',
      description: `Écritures exportées par journal vers Excel`
    });
  };

  // Liste des clients uniques et nombre de factures avec memoization
  const { clientsFromEcritures, nombreFacturesComptabilisees } = useMemo(() => {
    const clientNames = new Set<string>();
    const factureIds = new Set<string>();
    
    ecritures.forEach(e => {
      const client = getClient(e);
      if (client?.nom) clientNames.add(client.nom);
      
      if (e.facture?.id) factureIds.add(e.facture.id);
      if (e.factureVente?.id) factureIds.add(e.factureVente.id);
      if (e.journalBanque?.id) factureIds.add(e.journalBanque.id);
    });
    
    return {
      clientsFromEcritures: Array.from(clientNames),
      nombreFacturesComptabilisees: factureIds.size
    };
  }, [ecritures]);

  // Utilisation de la fonction utilitaire centralisée
  const formatCurrency = formatTND;

  const formatDateString = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getJournalTypeBadge = (typeJournal: string) => {
    switch (typeJournal) {
      case 'J_ACH':
        return <Badge className="bg-blue-100 text-blue-800">Achat</Badge>;
      case 'J_VTE':
        return <Badge className="bg-green-100 text-green-800">Vente</Badge>;
      case 'J_BQ':
        return <Badge className="bg-purple-100 text-purple-800">Banque</Badge>;
      case 'J_CA':
        return <Badge className="bg-yellow-100 text-yellow-800">Caisse</Badge>;
      case 'J_SAL':
        return <Badge className="bg-pink-100 text-pink-800">Salaire</Badge>;
      case 'J_OD':
        return <Badge className="bg-orange-100 text-orange-800">OD</Badge>;
      default:
        return <Badge variant="secondary">{typeJournal}</Badge>;
    }
  };

  const filteredClients = useMemo(() => 
    clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.societe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [clients, searchTerm]);

  const formatDateBigInt = (date: bigint | null) => {
    if (!date) return 'N/A';
    return new Date(Number(date)).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (statut: string | null) => {
    switch (statut) {
      case 'actif':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactif':
        return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  // Vue liste des clients
  if (view === 'clients') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Écritures Comptables</h1>
          <p className="text-slate-600 mt-1">Sélectionnez un client pour voir ses écritures</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold text-slate-800">
              <Users className="w-5 h-5 mr-2" /> Liste des Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, société ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading.clients ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    {searchTerm ? 'Aucun client trouvé' : 'Aucun client disponible'}
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.uid}
                      className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-slate-900">{client.nom}</h3>
                            {getStatusBadge(client.statut)}
                          </div>
                          <p className="text-slate-600 mt-1">{client.societe}</p>
                          {client.email && <p className="text-sm text-slate-500 mt-1">{client.email}</p>}
                          <p className="text-xs text-slate-400 mt-2">Inscrit le: {formatDateBigInt(client.date_inscription)}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" /> Voir les écritures
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="mt-4 text-sm text-gray-600">Total: {filteredClients.length} client(s)</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vue écritures du client sélectionné
  if (view === 'ecritures' && selectedClient) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBackToClients} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux clients
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Écritures de {selectedClient.nom}</h1>
            <p className="text-slate-600 mt-1">{selectedClient.societe}</p>
          </div>
        </div>

      {/* Section Factures Non Comptabilisées */}
      {facturesNonComptabilisees.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center text-orange-800">
              <FileText className="w-5 h-5 mr-2" />
              Factures à Comptabiliser
              <Badge className="ml-2 bg-orange-200 text-orange-900">
                {facturesNonComptabilisees.length} facture(s)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {facturesNonComptabilisees.map((facture) => (
                <div
                  key={facture.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-slate-900">{facture.reference}</p>
                          {facture.journal_type === 'J_ACH' && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Achat</Badge>
                          )}
                          {facture.journal_type === 'J_VTE' && (
                            <Badge className="bg-green-100 text-green-800 text-xs">Vente</Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          {facture.fournisseur || facture.clientdefacture || 'N/A'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateString(facture.date)} • {formatCurrency(facture.total_ttc)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleGenerateEcritures(facture.id, facture.reference)}
                    disabled={loading.generating}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    {loading.generating ? 'Génération...' : 'Générer les écritures'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Calculator className="w-6 h-6 mr-2" />
            Écritures Comptables
            <Badge className="ml-2 bg-green-100 text-green-800">
              {filteredEcritures.length} écritures
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtres par mois/année et export */}
          <div className="mb-6">
            <EcrituresFilters
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
              onExport={handleExportExcel}
              onExportByJournal={handleExportByJournal}
              totalEcritures={filteredEcritures.length}
            />
          </div>

          {/* Filtres par type de journal */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filtres par Type de Journal</h3>
              {(selectedTypeJournal !== 'J_ACH' || yearMonth || selectedMonth !== 'ALL' || selectedYear !== 'ALL') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTypeJournal('J_ACH');
                    setYearMonth('');
                    setSelectedMonth('ALL');
                    setSelectedYear('ALL');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
            <JournalTypeFilterButtons
              factures={ecritures
                .map(e => {
                  const journalType = getJournalType(e);
                  const id = e.facture?.id || e.factureVente?.id || e.journalBanque?.id || '';
                  return {
                    id,
                    type_journal: journalType
                  };
                })
                .filter(f => f.id)}
              selectedType={selectedTypeJournal}
              onTypeSelect={setSelectedTypeJournal}
            />
          </div>

          {/* Filtres */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par libellé, référence, client, compte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>
              <Input
                type="month"
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
                placeholder="Sélectionner mois/année"
              />
            </div>
          </div>

          {/* Statistiques */}
          <EcrituresStats
            totalDebit={totalDebit}
            totalCredit={totalCredit}
            nombreEcritures={filteredEcritures.length}
            nombreFacturesComptabilisees={nombreFacturesComptabilisees}
          />

          {/* Tableau des écritures */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Facture</TableHead>
                  <TableHead>Type Journal</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Débit</TableHead>
                  <TableHead className="text-right">Crédit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEcritures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      {searchTerm || selectedClient
                        ? 'Aucune écriture trouvée'
                        : 'Aucune écriture comptable'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEcritures.map((ecriture) => {
                    const client = getClient(ecriture);
                    const reference = getReference(ecriture);
                    const typeFacture = getTypeFacture(ecriture);
                    const journalType = getJournalType(ecriture);
                    
                    return (
                    <TableRow key={ecriture.id}>
                      <TableCell>{formatDateString(ecriture.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{reference}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {typeFacture}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getJournalTypeBadge(journalType)}
                      </TableCell>
                      <TableCell>
                        {client && (
                          <>
                            <div className="font-medium">{client.nom}</div>
                            <div className="text-sm text-gray-500">{client.societe}</div>
                          </>
                        )}
                      </TableCell>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(ecriture)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(ecriture.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'écriture comptable</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="libelle">Libellé *</Label>
              <Input
                id="libelle"
                value={formData.libelle}
                onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="debit">Débit</Label>
                <Input
                  id="debit"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.debit}
                  onChange={(e) => setFormData({ ...formData, debit: e.target.value, credit: '' })}
                />
              </div>
              <div>
                <Label htmlFor="credit">Crédit</Label>
                <Input
                  id="credit"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.credit}
                  onChange={(e) => setFormData({ ...formData, credit: e.target.value, debit: '' })}
                />
              </div>
            </div>

            {planComptable.length > 0 && (
              <div>
                <Label htmlFor="planId">Changer de compte (optionnel)</Label>
                <Select value={formData.planId} onValueChange={(value) => setFormData({ ...formData, planId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {planComptable.map((compte) => (
                      <SelectItem key={compte.id} value={compte.id}>
                        {compte.num_compte} - {compte.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                Modifier
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    );
  }

  return null;
}