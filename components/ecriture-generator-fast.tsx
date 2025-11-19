'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Brain, Settings, CheckCircle, AlertCircle } from 'lucide-react';

interface EcritureComptable {
  compte: string;
  libelle_compte: string;
  debit: number;
  credit: number;
}

interface ResultatEcriture {
  ecritures: EcritureComptable[];
  type_operation: "ACHAT" | "VENTE" | "AVOIR";
  total_debit: number;
  total_credit: number;
  equilibre: boolean;
  methode_generation: "GEMINI_AI" | "STATIC_RULES" | "HYBRID";
}

interface GenerationResult {
  success: boolean;
  result: ResultatEcriture;
  metadata: {
    generationTime: number;
    method: string;
    planComptableSize: number;
    saved: boolean;
  };
}

export default function EcritureGeneratorFast() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Données de test
  const [factureData, setFactureData] = useState({
    fournisseur: "INFORMATIQUE SERVICES SARL",
    type_journal: "J_ACH",
    total_ht: 1000,
    total_tva: 190,
    total_ttc: 1190,
    reference: "FACT-001",
    date: "2024-01-15"
  });

  // Options de génération
  const [options, setOptions] = useState({
    useGemini: true,
    maxRetries: 2,
    timeout: 5000
  });

  const generateEcritures = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/ecritures/generate-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factureData,
          options
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testEngine = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ecritures/generate-fast?test=engine');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du test');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'GEMINI_AI': return <Brain className="h-4 w-4 text-purple-500" />;
      case 'STATIC_RULES': return <Settings className="h-4 w-4 text-blue-500" />;
      default: return <Zap className="h-4 w-4 text-green-500" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GEMINI_AI': return 'bg-purple-100 text-purple-800';
      case 'STATIC_RULES': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Générateur d'Écritures Rapide</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Données facture */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fournisseur">Fournisseur</Label>
              <Input
                id="fournisseur"
                value={factureData.fournisseur}
                onChange={(e) => setFactureData(prev => ({ ...prev, fournisseur: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="type_journal">Type Journal</Label>
              <Select
                value={factureData.type_journal}
                onValueChange={(value) => setFactureData(prev => ({ ...prev, type_journal: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="J_ACH">J_ACH (Achat)</SelectItem>
                  <SelectItem value="J_VTE">J_VTE (Vente)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="total_ht">Total HT</Label>
              <Input
                id="total_ht"
                type="number"
                step="0.01"
                value={factureData.total_ht}
                onChange={(e) => setFactureData(prev => ({ ...prev, total_ht: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label htmlFor="total_tva">Total TVA</Label>
              <Input
                id="total_tva"
                type="number"
                step="0.01"
                value={factureData.total_tva}
                onChange={(e) => setFactureData(prev => ({ ...prev, total_tva: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label htmlFor="total_ttc">Total TTC</Label>
              <Input
                id="total_ttc"
                type="number"
                step="0.01"
                value={factureData.total_ttc}
                onChange={(e) => setFactureData(prev => ({ ...prev, total_ttc: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                value={factureData.reference}
                onChange={(e) => setFactureData(prev => ({ ...prev, reference: e.target.value }))}
              />
            </div>
          </div>

          {/* Options */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Options de génération</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useGemini"
                  checked={options.useGemini}
                  onChange={(e) => setOptions(prev => ({ ...prev, useGemini: e.target.checked }))}
                />
                <Label htmlFor="useGemini">Utiliser Gemini AI</Label>
              </div>

              <div>
                <Label htmlFor="maxRetries">Max Retries</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  min="1"
                  max="5"
                  value={options.maxRetries}
                  onChange={(e) => setOptions(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 2 }))}
                />
              </div>

              <div>
                <Label htmlFor="timeout">Timeout (ms)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="1000"
                  max="30000"
                  step="1000"
                  value={options.timeout}
                  onChange={(e) => setOptions(prev => ({ ...prev, timeout: parseInt(e.target.value) || 5000 }))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <Button 
              onClick={generateEcritures} 
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              <span>Générer Écritures</span>
            </Button>

            <Button 
              variant="outline" 
              onClick={testEngine} 
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
              <span>Test Moteur</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Erreur</span>
            </div>
            <p className="mt-2 text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Résultats */}
      {result && (
        <div className="space-y-4">
          {/* Métadonnées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Résultat de génération</span>
                <div className="flex items-center space-x-2">
                  {result.result.equilibre ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Badge className={getMethodColor(result.metadata.method)}>
                    {getMethodIcon(result.metadata.method)}
                    <span className="ml-1">{result.metadata.method}</span>
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Temps de génération</p>
                  <p className="font-medium">{result.metadata.generationTime}ms</p>
                </div>
                <div>
                  <p className="text-gray-600">Plan comptable</p>
                  <p className="font-medium">{result.metadata.planComptableSize} comptes</p>
                </div>
                <div>
                  <p className="text-gray-600">Type opération</p>
                  <p className="font-medium">{result.result.type_operation}</p>
                </div>
                <div>
                  <p className="text-gray-600">Équilibré</p>
                  <p className={`font-medium ${result.result.equilibre ? 'text-green-600' : 'text-red-600'}`}>
                    {result.result.equilibre ? 'Oui' : 'Non'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Écritures */}
          <Card>
            <CardHeader>
              <CardTitle>Écritures comptables générées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.result.ecritures.map((ecriture, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="font-mono">
                        {ecriture.compte}
                      </Badge>
                      <span className="font-medium">{ecriture.libelle_compte}</span>
                    </div>
                    <div className="flex space-x-4 text-sm">
                      <div className="text-right">
                        <p className="text-gray-600">Débit</p>
                        <p className="font-medium">{ecriture.debit.toFixed(2)} €</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600">Crédit</p>
                        <p className="font-medium">{ecriture.credit.toFixed(2)} €</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totaux */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Débit: {result.result.total_debit.toFixed(2)} €</span>
                  <span>Total Crédit: {result.result.total_credit.toFixed(2)} €</span>
                </div>
                <div className="text-center mt-2">
                  <span className={`text-sm ${result.result.equilibre ? 'text-green-600' : 'text-red-600'}`}>
                    Différence: {Math.abs(result.result.total_debit - result.result.total_credit).toFixed(2)} €
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}