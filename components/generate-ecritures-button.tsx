'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calculator, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GenerateEcrituresButtonProps {
  factureId: string;
  factureReference: string;
  status: string;
  onEcrituresGenerated?: () => void;
}

export default function GenerateEcrituresButton({ 
  factureId, 
 
  status,
  onEcrituresGenerated 
}: GenerateEcrituresButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateEcritures = async () => {
    if (status === 'COMPTABILISE') {
      toast({
        title: 'Information',
        description: 'Cette facture est déjà comptabilisée',
        variant: 'default',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ecritures-comptables/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ factureId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Succès',
          description: result.message,
        });
        
        if (onEcrituresGenerated) {
          onEcrituresGenerated();
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
      setLoading(false);
    }
  };

  if (status === 'COMPTABILISE') {
    return (
      <Button variant="outline" size="sm" disabled>
        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
        Comptabilisé
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleGenerateEcritures}
      disabled={loading}
    >
      <Calculator className="w-4 h-4 mr-2" />
      {loading ? 'Génération...' : 'Comptabiliser'}
    </Button>
  );
}