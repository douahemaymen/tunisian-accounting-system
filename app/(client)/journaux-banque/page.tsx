'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { JournalBanqueTable } from '@/components/tables/journal-banque-table';
import { ScanJournalBanqueModal } from '@/components/modals/scan-journal-banque-modal';
import type { JournalBanque } from '@/lib/types';

export default function JournauxBanquePage() {
  const { data: session } = useSession();
  const [journaux, setJournaux] = useState<JournalBanque[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalBanque | null>(null);

  const fetchJournaux = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      
      // Pour un client, utiliser son propre UID
      let clientUid = '';
      if (session.user.role === 'CLIENT') {
        const clientResponse = await fetch('/api/client/profile');
        if (clientResponse.ok) {
          const clientData = await clientResponse.json();
          clientUid = clientData.uid;
        }
      } else {
        // Pour un comptable, il faudrait sélectionner un client
        // Pour cet exemple, on prend le premier client
        const clientsResponse = await fetch('/api/clients');
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          if (clientsData.data && clientsData.data.length > 0) {
            clientUid = clientsData.data[0].uid;
          }
        }
      }

      if (!clientUid) {
        toast.error('Aucun client trouvé');
        return;
      }

      const response = await fetch(`/api/journal-banque?clientUid=${clientUid}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des journaux');
      }

      const data = await response.json();
      if (data.success) {
        setJournaux(data.data);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des journaux banque');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJournaux();
  }, [session]);

  const handleSaveJournal = async (journalData: Partial<JournalBanque>) => {
    try {
      // Récupérer le clientUid
      let clientUid = '';
      if (session?.user?.role === 'CLIENT') {
        const clientResponse = await fetch('/api/client/profile');
        if (clientResponse.ok) {
          const clientData = await clientResponse.json();
          clientUid = clientData.uid;
        }
      } else {
        // Pour un comptable, utiliser le premier client (à adapter selon vos besoins)
        const clientsResponse = await fetch('/api/clients');
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          if (clientsData.data && clientsData.data.length > 0) {
            clientUid = clientsData.data[0].uid;
          }
        }
      }

      const dataToSend = {
        ...journalData,
        clientUid
      };

      const url = editingJournal ? '/api/journal-banque' : '/api/journal-banque';
      const method = editingJournal ? 'PUT' : 'POST';

      if (editingJournal) {
        dataToSend.id = editingJournal.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      await fetchJournaux();
      setShowModal(false);
      setEditingJournal(null);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      throw error;
    }
  };

  const handleEdit = (journal: JournalBanque) => {
    setEditingJournal(journal);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/journal-banque?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      toast.success('Journal banque supprimé avec succès');
      await fetchJournaux();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJournal(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journaux Banque</h1>
          <p className="text-gray-600 mt-2">
            Gestion des journaux de banque et documents douaniers
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={fetchJournaux}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Journal
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Journaux Banque</CardTitle>
        </CardHeader>
        <CardContent>
          <JournalBanqueTable
            journaux={journaux}
            isLoading={isLoading}
            showClient={session?.user?.role === 'COMPTABLE'}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showActions={true}
            onJournalUpdated={fetchJournaux}
          />
        </CardContent>
      </Card>

      {/* Modal de création/édition */}
      <ScanJournalBanqueModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveJournal}
        initialData={editingJournal || undefined}
        mode={editingJournal ? 'edit' : 'create'}
      />
    </div>
  );
}