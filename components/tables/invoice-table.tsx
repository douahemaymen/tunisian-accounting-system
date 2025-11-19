'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Edit, Trash2, Calculator, Brain, Loader2 } from 'lucide-react';
import { ImageModal } from '@/components/ui/image-modal';
import { ComptabiliserButton } from '@/components/comptabiliser-button';
import FactureEcrituresModal from '@/components/facture-ecritures-modal';
import type { Facture } from '@/lib/types';
import { formatTND } from '@/lib/currency-utils';
import { getFactureTypeLabel, isJournalBanque, isAvoir } from '@/lib/journal-utils';

interface InvoiceTableProps {
  factures: Facture[];
  isLoading: boolean;
  showClient?: boolean;
  onEdit?: (facture: Facture) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  onFactureUpdated?: () => void;
  onGenerateEcritures?: (facture: Facture) => void;
  generatingEcritures?: string | null;
}

export function InvoiceTable({ 
  factures, 
  isLoading, 
  showClient = false, 
  onEdit, 
  onDelete, 
  showActions = false, 
  onFactureUpdated, 
  onGenerateEcritures, 
  generatingEcritures 
}: InvoiceTableProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [selectedFactureEcritures, setSelectedFactureEcritures] = useState<{ id: string; reference: string } | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  const getStatusBadge = (status: string, accountingEntries?: any) => {
    const hasAutoEntries = accountingEntries?.generated_by === 'gemini-ai-auto-scan';
    
    switch (status) {
      case 'COMPTABILISE':
      case 'VALIDATED':
        return (
          <div className="flex items-center space-x-1">
            <Badge className="bg-emerald-100 text-emerald-800">
              {hasAutoEntries ? '🧠 Auto-comptabilisée' : '✅ Comptabilisé'}
            </Badge>
          </div>
        );
      case 'NON_COMPTABILISE':
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">🟡 Non comptabilisé</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejetée</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const getFactureTypeBadge = (typeFacture: string) => {
    switch (typeFacture) {
      case 'FACTURE_ORDINAIRE_DT':
        return <Badge className="bg-blue-100 text-blue-800">Facture DT</Badge>;
      case 'FACTURE_ORDINAIRE_DEVISE':
        return <Badge className="bg-indigo-100 text-indigo-800">Facture Devise</Badge>;
      case 'FACTURE_AVOIR':
        return <Badge className="bg-red-100 text-red-800">Avoir</Badge>;
      case 'RISTOURNE_ACHAT':
        return <Badge className="bg-orange-100 text-orange-800">Ristourne</Badge>;
      case 'VENTE_ORDINAIRE_DT':
        return <Badge className="bg-green-100 text-green-800">Vente DT</Badge>;
      case 'VENTE_ORDINAIRE_DEVISE':
        return <Badge className="bg-emerald-100 text-emerald-800">Vente Devise</Badge>;
      case 'VENTE_AVOIR':
        return <Badge className="bg-red-100 text-red-800">Avoir Vente</Badge>;
      case 'RISTOURNE_VENTE':
        return <Badge className="bg-yellow-100 text-yellow-800">Ristourne Vente</Badge>;
      case 'JOURNAL_BANQUE':
        return <Badge className="bg-purple-100 text-purple-800">🏦 Banque</Badge>;
      default:
        return <Badge variant="secondary">{typeFacture}</Badge>;
    }
  };

  const getJournalTypeBadge = (facture: Facture) => {
    if (facture.type_facture) {
      return getFactureTypeBadge(facture.type_facture);
    }
    
    const typeJournal = (facture as any).type_journal;
    if (typeJournal) {
      switch (typeJournal) {
        case 'J_ACH':
          return <Badge className="bg-blue-100 text-blue-800">Achat</Badge>;
        case 'J_VTE':
          return <Badge className="bg-green-100 text-green-800">Vente</Badge>;
        case 'J_BQ':
          return <Badge className="bg-purple-100 text-purple-800">🏦 Banque</Badge>;
        default:
          return <Badge variant="secondary">{typeJournal}</Badge>;
      }
    }
    
    return <Badge variant="secondary">Non défini</Badge>;
  };

  const hasJournalBanque = factures.some(f => isJournalBanque(f));

  // Détecter si on a des factures de vente
  const hasJournalVente = factures.some(f => 
    f.type_facture?.startsWith('VENTE_') || 
    (f as any).type_journal === 'J_VTE' ||
    (f as any).clientdefacture
  );

  const getColumnHeaders = () => {
    if (hasJournalBanque) {
      return {
        col1: "Importateur/Exportateur",
        col2: "Matricule Fiscal", 
        col3: "Montant DD",
        col4: "Montant CIF/DCI",
        col5: "Montant TVA AP",
        col6: "Total Liquidé",
        col7: "Montant Payé"
      };
    }
    return {
      col1: hasJournalVente ? "Client" : "Fournisseur",
      col2: "Référence",
      col3: "Montant HT",
      col4: "TVA",
      col5: "Total TTC",
      col6: "",
      col7: ""
    };
  };

  const getRowData = (facture: Facture) => {
    if (isJournalBanque(facture)) {
      const journal = facture as any;
      return {
        col1: journal.importateur_exportateur || facture.fournisseur,
        col2: journal.matricule_fiscal || '',
        col3: formatTND(journal.montant_dd || 0),
        col4: formatTND(journal.montant_cif_dci || 0),
        col5: formatTND(journal.montant_tva_ap || 0),
        col6: formatTND(journal.total_sommes_liquidees || 0),
        col7: formatTND(journal.montant_paye || 0),
        reference: journal.numero || facture.reference
      };
    }
    
    // Détecter si c'est une facture de vente
    const isVente = facture.type_facture?.startsWith('VENTE_') || 
                    (facture as any).type_journal === 'J_VTE' ||
                    (facture as any).clientdefacture;
    
    return {
      col1: isVente ? ((facture as any).clientdefacture || facture.fournisseur) : facture.fournisseur,
      col2: facture.reference,
      col3: formatTND(facture.total_ht),
      col4: formatTND(facture.total_tva),
      col5: formatTND(facture.total_ttc),
      col6: '',
      col7: '',
      reference: facture.reference
    };
  };

  const headers = getColumnHeaders();

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {showClient && <TableHead className="font-semibold text-slate-700">Client</TableHead>}
              <TableHead className="font-semibold text-slate-700">{headers.col1}</TableHead>
              <TableHead className="font-semibold text-slate-700">Date</TableHead>
              {!hasJournalBanque && <TableHead className="font-semibold text-slate-700">Référence</TableHead>}
              {hasJournalBanque && <TableHead className="font-semibold text-slate-700">{headers.col2}</TableHead>}
              {hasJournalBanque && <TableHead className="font-semibold text-slate-700">Numéro</TableHead>}
              <TableHead className="font-semibold text-slate-700">Type Journal</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">{headers.col3}</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">{headers.col4}</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">{headers.col5}</TableHead>
              {hasJournalBanque && <TableHead className="font-semibold text-slate-700 text-right">{headers.col6}</TableHead>}
              {hasJournalBanque && <TableHead className="font-semibold text-slate-700 text-right">{headers.col7}</TableHead>}
              <TableHead className="font-semibold text-slate-700">Statut</TableHead>
              <TableHead className="font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hasJournalBanque ? (showClient ? 12 : 11) : (showClient ? 9 : 8)} className="text-center py-8 text-slate-500">
                  {hasJournalBanque ? 'Aucun journal banque trouvé' : 'Aucune facture trouvée'}
                </TableCell>
              </TableRow>
            ) : (
              factures.map((facture) => {
                const rowData = getRowData(facture);
                return (
                  <TableRow key={facture.id} className="hover:bg-slate-50">
                    {showClient && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{facture.client?.nom}</span>
                          <span className="text-xs text-slate-500">{facture.client?.societe}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      {isJournalBanque(facture) ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-600">🏦</span>
                          <span>{rowData.col1}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {hasJournalVente && <span className="text-green-600">👤</span>}
                          <span>{rowData.col1}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{new Date(facture.date).toLocaleDateString('fr-FR')}</TableCell>
                    {!hasJournalBanque && (
                      <TableCell className="font-mono text-sm">{rowData.col2}</TableCell>
                    )}
                    {hasJournalBanque && (
                      <TableCell className="font-mono text-sm">{rowData.col2}</TableCell>
                    )}
                    {hasJournalBanque && (
                      <TableCell className="font-mono text-sm">{rowData.reference}</TableCell>
                    )}
                    <TableCell>{getJournalTypeBadge(facture)}</TableCell>
                    <TableCell className="text-right text-sm">{rowData.col3}</TableCell>
                    <TableCell className="text-right text-sm">{rowData.col4}</TableCell>
                    <TableCell className="text-right text-sm">{rowData.col5}</TableCell>
                    {hasJournalBanque && (
                      <TableCell className="text-right text-sm font-semibold text-blue-600">{rowData.col6}</TableCell>
                    )}
                    {hasJournalBanque && (
                      <TableCell className="text-right text-sm font-semibold text-green-600">{rowData.col7}</TableCell>
                    )}
                    <TableCell>
                      {getStatusBadge(facture.status, facture.accounting_entries)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedImage({
                            url: facture.image_url,
                            title: isJournalBanque(facture) 
                              ? `Journal Banque - ${rowData.col1} (${rowData.reference})`
                              : `Facture - ${facture.fournisseur} (${facture.reference})`
                          })}
                          title={isJournalBanque(facture) ? "Voir le journal banque" : "Voir la facture"}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Télécharger">
                          <Download className="w-4 h-4" />
                        </Button>
                        {facture.status === 'PENDING' && (
                          <ComptabiliserButton
                            facture={facture}
                            onComptabilise={onFactureUpdated}
                          />
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedFactureEcritures({
                            id: facture.id,
                            reference: rowData.reference
                          })}
                          title="Voir les écritures comptables"
                        >
                          <Calculator className="w-4 h-4" />
                        </Button>
                        {showActions && onGenerateEcritures && facture.status !== 'COMPTABILISE' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onGenerateEcritures(facture)}
                            disabled={generatingEcritures === facture.id}
                            title="Générer les écritures comptables"
                          >
                            {generatingEcritures === facture.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Brain className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        {showActions && onEdit && facture.status === 'COMPTABILISE' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit(facture)}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {showActions && onDelete && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
                                onDelete(facture.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden">
        {factures.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Aucune facture trouvée
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {factures.map((facture) => {
              const rowData = getRowData(facture);
              return (
                <div key={facture.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      {showClient && (
                        <div className="mb-1">
                          <p className="text-xs text-slate-500">Client:</p>
                          <p className="text-sm font-medium text-slate-700">{facture.client?.nom} - {facture.client?.societe}</p>
                        </div>
                      )}
                      <h3 className="font-medium text-slate-900 truncate">
                        {isJournalBanque(facture) ? (
                          <span className="flex items-center space-x-2">
                            <span className="text-purple-600">🏦</span>
                            <span>{rowData.col1}</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-2">
                            {hasJournalVente && <span className="text-green-600">👤</span>}
                            <span>{rowData.col1}</span>
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-500">{new Date(facture.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    {getStatusBadge(facture.status, facture.accounting_entries)}
                  </div>
                  
                  <div className="space-y-2">
                    {isJournalBanque(facture) ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Numéro:</span>
                          <span className="font-mono">{rowData.reference}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Matricule Fiscal:</span>
                          <span className="font-mono">{rowData.col2}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Type Journal:</span>
                          {getJournalTypeBadge(facture)}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Montant DD:</span>
                          <span>{rowData.col3}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Montant CIF/DCI:</span>
                          <span>{rowData.col4}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Montant TVA AP:</span>
                          <span>{rowData.col5}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Total Liquidé:</span>
                          <span className="font-semibold text-blue-600">{rowData.col6}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-slate-900">Montant Payé:</span>
                          <span className="text-green-600">{rowData.col7}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Référence:</span>
                          <span className="font-mono">{facture.reference}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Type Journal:</span>
                          {getJournalTypeBadge(facture)}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Montant HT:</span>
                          <span>{formatTND(facture.total_ht)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">TVA:</span>
                          <span>{formatTND(facture.total_tva)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-slate-900">Total TTC:</span>
                          <span className="text-slate-900">{formatTND(facture.total_ttc)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedImage({
                        url: facture.image_url,
                        title: isJournalBanque(facture) 
                          ? `Journal Banque - ${rowData.col1} (${rowData.reference})`
                          : `Facture - ${facture.fournisseur} (${facture.reference})`
                      })}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                    {showActions && onEdit && facture.status === 'COMPTABILISE' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEdit(facture)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                    )}
                    {showActions && onDelete && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
                            onDelete(facture.id);
                          }
                        }}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de visualisation d'image */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          title={selectedImage.title}
        />
      )}

      {/* Modal des écritures comptables */}
      {selectedFactureEcritures && (
        <FactureEcrituresModal
          isOpen={!!selectedFactureEcritures}
          onClose={() => setSelectedFactureEcritures(null)}
          factureId={selectedFactureEcritures.id}
          factureReference={selectedFactureEcritures.reference}
        />
      )}
    </div>
  );
}