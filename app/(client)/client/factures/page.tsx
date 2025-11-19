'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from "next-auth/react";

// Types et configurations
import type { Facture } from '@/lib/types'; 
import { JournalType } from '@/lib/types'; 
import { 
  TABS, 
  JournalTable
} from '@/components/factureupload/JournalDashboard'; 

// Composants & Utils
import { Icon } from '@/components/factureupload/Icons';
import { Spinner } from '@/components/ui/spinner';
import { ScanFactureClientModal } from '@/components/modals/scan-facture-client-modal';
import { toCsv } from '@/components/factureupload/format'; 


// ============= MAIN PAGE COMPONENT =============

export default function ClientFacturesPage() {
  const { data: session, status } = useSession();
  // Pour un client, le clientUid est directement le user.id
  const clientUid = session?.user?.role === "client" ? session.user.id : null;
  
  console.log('👤 Session info:', {
    status,
    role: session?.user?.role,
    userId: session?.user?.id,
    clientUid
  });

  // --- State du Tableau de Bord ---
  const [activeTab, setActiveTab] = useState<JournalType>(JournalType.ACHATS);
  const [factures, setFactures] = useState<Facture[]>([]); 
  const [isDataLoading, setIsDataLoading] = useState(true); 

  // --- State du Modal d'Upload ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ---------------------------------------------
  // 🟢 LOGIQUE D'APPEL API (GET: Récupération des factures)
  // ---------------------------------------------
  const fetchJournauxAchat = useCallback(async (uid: string) => {
    console.log('🔄 Récupération des factures pour clientUid:', uid);
    setIsDataLoading(true);
    try {
      // Récupération des factures d'achat
      console.log('📥 Appel API: /api/journal-achat?clientUid=' + uid);
      const responseAchat = await fetch(`/api/journal-achat?clientUid=${uid}`);
      if (!responseAchat.ok) {
        const errorData = await responseAchat.json();
        throw new Error(errorData.error || `Erreur de récupération factures achat HTTP: ${responseAchat.status}`);
      }
      const facturesAchat: Facture[] = await responseAchat.json();
      console.log('✅ Factures d\'achat récupérées:', facturesAchat.length, facturesAchat);

      // Récupération des factures de vente
      console.log('📥 Appel API: /api/journal-vente?clientUid=' + uid);
      const responseVente = await fetch(`/api/journal-vente?clientUid=${uid}`);
      let facturesVente: Facture[] = [];
      if (responseVente.ok) {
        facturesVente = await responseVente.json();
        console.log('✅ Factures de vente récupérées:', facturesVente.length, facturesVente);
      }

      // Récupération des journaux banque (pour affichage dans l'onglet banque)
      console.log('📥 Appel API: /api/journal-banque?clientUid=' + uid);
      const responseBanque = await fetch(`/api/journal-banque?clientUid=${uid}`);
      let journauxBanque: any[] = [];
      if (responseBanque.ok) {
        journauxBanque = await responseBanque.json();
        console.log('✅ Journaux banque récupérés:', journauxBanque.length, journauxBanque);
      }

      // Combiner tous les types de documents
      const allFactures = [...facturesAchat, ...facturesVente, ...journauxBanque];
      console.log('📊 Total factures combinées:', allFactures.length, allFactures);
      setFactures(allFactures);
    } catch (e) {
      console.error('Erreur lors du chargement des factures:', e);
      setFactures([]);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientUid) {
      fetchJournauxAchat(clientUid);
    } else if (status === 'unauthenticated') {
      setIsDataLoading(false);
    }
  }, [clientUid, status, fetchJournauxAchat]);


  // ---------------------------------------------
  // 🟢 GESTION DE L'AJOUT DE FACTURE
  // ---------------------------------------------
  const handleFactureAdded = useCallback((newFacture: Facture) => {
    setFactures(prev => [newFacture, ...prev]);
    setIsModalOpen(false);
  }, []);


  // ---------------------------------------------
  // 🟢 LOGIQUE DE SUPPRESSION (DELETE)
  // ---------------------------------------------
  const handleDeleteFacture = useCallback(async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;

    try {
      const response = await fetch(`/api/journal-achat?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur de suppression HTTP: ${response.status}`);
      }

      setFactures(prev => prev.filter(f => f.id !== id));

    } catch (e) {
      console.error('Échec de la suppression:', e);
    }
  }, []);
  
  // ---------------------------------------------
  // 🟢 UTILS & GESTION DES ÉTATS
  // ---------------------------------------------
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const filteredFactures = useMemo(() => {
    console.log('📊 Toutes les factures (sans filtre par date):', {
      totalFactures: factures.length,
      factures: factures.map(f => ({
        id: f.id,
        type_journal: f.type_journal,
        date: f.date,
        created_at: f.created_at
      }))
    });
    
    // Retourner toutes les factures sans filtre par date
    return factures;
  }, [factures]);

  const handleExport = () => {
    const current = filteredFactures.filter(f => f.type_journal === activeTab);
    const csv = toCsv(current as unknown as Record<string, unknown>[]); 
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${activeTab}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // ---------------------------------------------
  // 🟢 RENDU
  // ---------------------------------------------

  if (status === 'loading' || isDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner text={status === 'loading' ? "Authentification..." : "Chargement des factures..."} />
      </div>
    );
  }

  if (!clientUid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Veuillez vous connecter en tant que client.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Tableau de bord</h1>
            <p className="text-sm sm:text-base text-gray-600">Gérez vos documents comptables</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium w-full sm:w-auto justify-center"
          >
            <Icon name="plus" className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Nouveau document</span>
          </button>
        </div>

        {/* Tableau des Factures (Tabs + Table) */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex" aria-label="Tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Total: {filteredFactures.filter(f => f.type_journal === activeTab).length} facture(s)
              </span>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium shadow-md"
            >
              📊 Exporter CSV
            </button>
          </div>

          {/* Table du Journal Actif */}
          <JournalTable
            data={(() => {
              const data = filteredFactures.filter(f => f.type_journal === activeTab);
              console.log('📋 Données pour le tableau:', {
                activeTab,
                filteredCount: filteredFactures.length,
                matchingCount: data.length,
                data: data.map(f => ({ id: f.id, type_journal: f.type_journal }))
              });
              return data;
            })()}
            type={activeTab}
            onEdit={() => {}} 
            onDelete={handleDeleteFacture} 
          />
        </div>
      </div>

      {/* Modal de Scan de Facture - Version Client (enregistrement automatique) */}
      {clientUid && (
        <ScanFactureClientModal
          isOpen={isModalOpen}
          onClose={closeModal}
          clientUid={clientUid}
          clientName={session?.user?.name || 'Client'}
          onFactureAdded={handleFactureAdded}
        />
      )}
    </div>
  );
}