'use client';

import EcriturePerformanceDashboard from '@/components/ecriture-performance-dashboard';
import EcritureGeneratorFast from '@/components/ecriture-generator-fast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Zap, Settings, Brain } from 'lucide-react';

export default function PerformancePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center">
          <BarChart3 className="w-8 h-8 mr-3" />
          Performance & Outils IA
        </h1>
        <p className="text-slate-600 mt-2">
          Tableau de bord des performances du moteur d'écritures comptables et outils de génération
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="generator" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Générateur</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configuration</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <EcriturePerformanceDashboard />
        </TabsContent>

        <TabsContent value="generator">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Générateur d'Écritures Intelligent</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EcritureGeneratorFast />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration du Moteur IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Paramètres Gemini AI</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Timeout par défaut:</span>
                          <span className="font-medium">5000ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nombre de tentatives:</span>
                          <span className="font-medium">2</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cache activé:</span>
                          <span className="font-medium text-green-600">Oui (2h)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Modèle utilisé:</span>
                          <span className="font-medium">gemini-2.5-flash</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Règles Statiques</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Comptes configurés:</span>
                          <span className="font-medium">15</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Règles de mapping:</span>
                          <span className="font-medium">8 catégories</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fallback activé:</span>
                          <span className="font-medium text-green-600">Oui</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Temps de génération:</span>
                          <span className="font-medium">&lt; 100ms</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Mapping Intelligent</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-2">Charges (6xxx)</h4>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Informatique → 6060000 (Entretien)</li>
                          <li>• Conseil → 6220000 (Honoraires)</li>
                          <li>• Fournitures → 6020000 (Consommables)</li>
                          <li>• Transport → 6250000 (Déplacements)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Produits (7xxx)</h4>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Marchandises → 7010000 (Ventes)</li>
                          <li>• Services → 7030000 (Prestations)</li>
                          <li>• Produits → 7020000 (Fabriqués)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Stratégie de Génération</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">1. Vérification du cache Gemini (2h)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">2. Génération avec Gemini AI (priorité)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">3. Retry automatique (jusqu'à 2 tentatives)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">4. Fallback vers règles statiques</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">5. Équilibrage automatique des écritures</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Comptable Utilisé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Tiers (4xxx)</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>4010000 - Fournisseurs</li>
                      <li>4110000 - Clients</li>
                      <li>4450000 - TVA collectée</li>
                      <li>4453000 - TVA déductible</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Charges (6xxx)</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>6020000 - Fournitures</li>
                      <li>6060000 - Entretien</li>
                      <li>6220000 - Honoraires</li>
                      <li>6250000 - Transport</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Produits (7xxx)</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>7010000 - Ventes marchandises</li>
                      <li>7020000 - Produits fabriqués</li>
                      <li>7030000 - Prestations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}