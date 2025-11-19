'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calculator, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Facture, JournalVente, JournalBanque } from '@/lib/types';

interface ComptabiliserButtonProps {
  facture: Facture | JournalVente | JournalBanque;
  onComptabilise?: () => void;
}

export function ComptabiliserButton({ facture, onComptabilise }: ComptabiliserButtonProps) {
  const [isComptabilising, setIsComptabilising] = useState(false);
  const { toast } = useToast();

  const handleComptabiliser = async () => {
    if (facture.status === 'VALIDATED') {
      toast({
        title: 'Déjà comptabilisé',
        description: 'Ce document est déjà comptabilisé',
        variant: 'destructive',
      });
      return;
    }

    setIsComptabilising(true);
    try {
      // Déterminer le type de document et l'endpoint approprié
      let endpoint = '/api/comptable-actions/comptabiliser';
      let bodyParam: { factureId?: string; factureVenteId?: string; journalBanqueId?: string } = { factureId: facture.id };
      let documentType = 'facture d\'achat';

      // Vérifier si c'est une facture de vente
      if ('clientdefacture' in facture) {
        endpoint = '/api/comptable-actions/comptabiliser-vente';
        bodyParam = { factureVenteId: facture.id };
        documentType = 'facture de vente';
      }
      // Vérifier si c'est un journal banque
      else if ('importateur_exportateur' in facture) {
        endpoint = '/api/comptable-actions/comptabiliser-banque';
        bodyParam = { journalBanqueId: facture.id };
        documentType = 'journal banque';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyParam),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: `🧠 ${documentType} comptabilisé avec Gemini AI`,
          description: `${data.ecrituresCount} écriture(s) générée(s)`,
        });
        onComptabilise?.();
      } else {
        toast({
          title: 'Erreur de comptabilisation',
          description: data.error || 'Erreur lors de la comptabilisation',
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
      setIsComptabilising(false);
    }
  };

  // Si déjà comptabilisée, afficher un badge
  if (facture.status === 'VALIDATED') {
    return (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Comptabilisée
      </Badge>
    );
  }

  // Si en attente ou rejetée, afficher le bouton
  return (
    <Button
      onClick={handleComptabiliser}
      disabled={isComptabilising}
      size="sm"
      className="bg-violet-600 hover:bg-violet-700 text-white"
    >
      {isComptabilising ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Comptabilisation...
        </>
      ) : (
        <>
          <Calculator className="w-4 h-4 mr-2" />
          🧠 Comptabiliser
        </>
      )}
    </Button>
  );
}