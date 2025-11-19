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
import { MouvementsBanqueModal } from '@/components/modals/mouvements-banque-modal';
import type { JournalBanque } from '@/lib/types';
import { formatTND } from '@/lib/currency-utils';

interface JournalBanqueTableProps {
  journaux: JournalBanque[];
  isLoading: boolean;
  showClient?: boolean;
  onEdit?: (journal: JournalBanque) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  onJournalUpdated?: () => void;
  onGenerateEcritures?: (journal: JournalBanque) => void;
  generatingEcritures?: string | null;
}

export function JournalBanqueTable({ 
  journaux, 
  isLoading, 
  showClient = false, 
  onEdit, 
  onDelete, 
  showActions = false, 
  onJournalUpdated, 
  onGenerateEcritures, 
  generatingEcritures 
}: JournalBanqueTableProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [selectedJournalEcritures, setSelectedJournalEcritures] = useState<{ id: string; date: string } | null>(null);
  const [selectedJournalMouvements, setSelectedJournalMouvements] = useState<JournalBanque | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPTABILISE':
      case 'VALIDATED':
        return <Badge className="bg-emerald-100 text-emerald-800">✅ Comptabilisé</Badge>;
      case 'NON_COMPTABILISE':
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">🟡 Non comptabilisé</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {showClient && <TableHead className="font-semibold text-slate-700">Client</TableHead>}
              <TableHead className="font-semibold text-slate-700">Date</TableHead>
              <TableHead className="font-semibold text-slate-700">Titulaire</TableHead>
              <TableHead className="font-semibold text-slate-700">N° Compte</TableHead>
              <TableHead className="font-semibold text-slate-700">Mouvements</TableHead>
              <TableHead className="font-semibold text-slate-700">Statut</TableHead>
              <TableHead className="font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {journaux.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showClient ? 7 : 6} className="text-center py-8 text-slate-500">
                  Aucun journal banque trouvé
                </TableCell>
              </TableRow>
            ) : (
              journaux.map((journal) => {
                const mouvementsCount = journal.mouvements?.length || 0;
                return (
                  <TableRow key={journal.id} className="hover:bg-slate-50">
                    {showClient && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{journal.client?.nom}</span>
                          <span className="text-xs text-slate-500">{journal.client?.societe}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>{new Date(journal.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="font-medium">{journal.titulaire}</TableCell>
                    <TableCell className="font-mono text-sm">{journal.numero_compte}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedJournalMouvements(journal)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium"
                      >
                        {mouvementsCount} mouvement{mouvementsCount > 1 ? 's' : ''}
                      </Button>
                    </TableCell>
                    <TableCell>{getStatusBadge(journal.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {journal.image_url && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedImage({
                              url: journal.image_url!,
                              title: `Journal Banque - ${journal.date}`
                            })}
                            title="Voir le document"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" title="Télécharger">
                          <Download className="w-4 h-4" />
                        </Button>
                        {journal.status === 'PENDING' && (
                          <ComptabiliserButton
                            facture={journal as any}
                            onComptabilise={onJournalUpdated}
                          />
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedJournalEcritures({
                            id: journal.id,
                            date: journal.date
                          })}
                          title="Voir les écritures comptables"
                        >
                          <Calculator className="w-4 h-4" />
                        </Button>
                        {showActions && onGenerateEcritures && journal.status !== 'COMPTABILISE' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onGenerateEcritures(journal)}
                            disabled={generatingEcritures === journal.id}
                            title="Générer les écritures comptables"
                          >
                            {generatingEcritures === journal.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Brain className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        {showActions && onEdit && journal.status === 'COMPTABILISE' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit(journal)}
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
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce journal banque ?')) {
                                onDelete(journal.id);
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
        {journaux.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Aucun journal banque trouvé
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {journaux.map((journal) => {
              const mouvementsCount = journal.mouvements?.length || 0;
              return (
                <div key={journal.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      {showClient && (
                        <div className="mb-1">
                          <p className="text-xs text-slate-500">Client:</p>
                          <p className="text-sm font-medium text-slate-700">{journal.client?.nom} - {journal.client?.societe}</p>
                        </div>
                      )}
                      <h3 className="font-medium text-slate-900 truncate">🏦 {journal.titulaire}</h3>
                      <p className="text-sm text-slate-500">{new Date(journal.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    {getStatusBadge(journal.status)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">N° Compte:</span>
                      <span className="font-mono">{journal.numero_compte}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Mouvements:</span>
                      <button
                        onClick={() => setSelectedJournalMouvements(journal)}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        {mouvementsCount} mouvement{mouvementsCount > 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    {journal.image_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedImage({
                          url: journal.image_url!,
                          title: `Journal Banque - ${journal.date}`
                        })}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                    {showActions && onEdit && journal.status === 'COMPTABILISE' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEdit(journal)}
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
                          if (confirm('Êtes-vous sûr de vouloir supprimer ce journal banque ?')) {
                            onDelete(journal.id);
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
      {selectedJournalEcritures && (
        <FactureEcrituresModal
          isOpen={!!selectedJournalEcritures}
          onClose={() => setSelectedJournalEcritures(null)}
          factureId={selectedJournalEcritures.id}
          factureReference={selectedJournalEcritures.date}
        />
      )}

      {/* Modal des mouvements bancaires */}
      {selectedJournalMouvements && (
        <MouvementsBanqueModal
          isOpen={!!selectedJournalMouvements}
          onClose={() => setSelectedJournalMouvements(null)}
          journal={selectedJournalMouvements}
        />
      )}
    </div>
  );
}
