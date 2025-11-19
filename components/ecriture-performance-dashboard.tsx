'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Settings, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface PerformanceStats {
  totalEcritures: number;
  methodStats: {
    GEMINI_AI: { count: number; avgTime: number; successRate: number };
    STATIC_RULES: { count: number; avgTime: number; successRate: number };
    HYBRID: { count: number; avgTime: number; successRate: number };
  };
  recentGenerations: Array<{
    id: string;
    method: string;
    time: number;
    success: boolean;
    factureRef: string;
    timestamp: string;
  }>;
  equilibreRate: number;
  avgGenerationTime: number;
}

export default function EcriturePerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/ecritures/stats');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'GEMINI_AI': return <Brain className="h-4 w-4 text-purple-500" />;
      case 'STATIC_RULES': return <Settings className="h-4 w-4 text-blue-500" />;
      case 'HYBRID': return <Zap className="h-4 w-4 text-green-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GEMINI_AI': return 'bg-purple-100 text-purple-800';
      case 'STATIC_RULES': return 'bg-blue-100 text-blue-800';
      case 'HYBRID': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement des statistiques...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Aucune statistique disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance du Moteur d'Écritures</h2>
          <p className="text-gray-600">Statistiques et métriques de génération</p>
        </div>
        <Button
          onClick={fetchStats}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Actualiser
        </Button>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Écritures</p>
                <p className="text-2xl font-bold">{stats.totalEcritures}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Temps Moyen</p>
                <p className="text-2xl font-bold">{formatTime(stats.avgGenerationTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Taux d'Équilibre</p>
                <p className="text-2xl font-bold">{stats.equilibreRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Méthode Principale</p>
                <div className="flex items-center space-x-1">
                  {getMethodIcon('GEMINI_AI')}
                  <span className="text-sm font-medium">Gemini AI</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques par méthode */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par Méthode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.methodStats).map(([method, methodStats]) => (
              <div key={method} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getMethodIcon(method)}
                    <Badge className={getMethodColor(method)}>
                      {method.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {methodStats.count} générations
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Temps moyen</p>
                    <p className="text-lg font-semibold">{formatTime(methodStats.avgTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taux de succès</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={methodStats.successRate} className="flex-1" />
                      <span className="text-sm font-medium">{methodStats.successRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Utilisation</p>
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={(methodStats.count / stats.totalEcritures) * 100} 
                        className="flex-1" 
                      />
                      <span className="text-sm font-medium">
                        {((methodStats.count / stats.totalEcritures) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Générations récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Générations Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentGenerations.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Aucune génération récente
              </div>
            ) : (
              stats.recentGenerations.map((generation) => (
                <div 
                  key={generation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {generation.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    
                    <div>
                      <p className="font-medium">{generation.factureRef}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(generation.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge className={getMethodColor(generation.method)}>
                      {getMethodIcon(generation.method)}
                      <span className="ml-1">{generation.method.replace('_', ' ')}</span>
                    </Badge>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatTime(generation.time)}</p>
                      <p className={`text-xs ${generation.success ? 'text-green-600' : 'text-red-600'}`}>
                        {generation.success ? 'Succès' : 'Échec'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.equilibreRate < 95 && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Taux d'équilibre faible</p>
                  <p className="text-sm text-yellow-700">
                    Vérifiez la configuration du plan comptable et les règles de mapping
                  </p>
                </div>
              </div>
            )}

            {stats.avgGenerationTime > 5000 && (
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Temps de génération élevé</p>
                  <p className="text-sm text-blue-700">
                    Considérez réduire le timeout Gemini ou optimiser les règles statiques
                  </p>
                </div>
              </div>
            )}

            {stats.methodStats.GEMINI_AI.successRate < 80 && (
              <div className="flex items-start space-x-2 p-3 bg-purple-50 rounded-lg">
                <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-800">Taux de succès Gemini faible</p>
                  <p className="text-sm text-purple-700">
                    Vérifiez la clé API Gemini et la stabilité de la connexion
                  </p>
                </div>
              </div>
            )}

            {stats.totalEcritures > 0 && stats.equilibreRate >= 95 && stats.avgGenerationTime <= 5000 && (
              <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Performance optimale</p>
                  <p className="text-sm text-green-700">
                    Le moteur d'écritures fonctionne parfaitement
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}