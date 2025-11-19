'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportResult {
  success: boolean;
  comptesCreated: number;
  errors?: string[];
}

interface PlanComptableImportProps {
  onImportSuccess: () => void;
}

export default function PlanComptableImport({ onImportSuccess }: PlanComptableImportProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleJsonImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir des données JSON',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(jsonData);
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Format JSON invalide',
          variant: 'destructive',
        });
        return;
      }

      console.log('Données à envoyer:', parsedData);

      const response = await fetch('/api/plancomptable/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });

      console.log('Statut réponse:', response.status);
      const result: ImportResult = await response.json();
      console.log('Résultat:', result);

      if (response.ok && result.success) {
        toast({
          title: 'Succès',
          description: `${result.comptesCreated} compte(s) importé(s) avec succès`,
        });
        
        if (result.errors && result.errors.length > 0) {
          console.log('Erreurs d\'import:', result.errors);
          toast({
            title: 'Avertissements',
            description: `${result.errors.length} ligne(s) ignorée(s). Voir la console pour les détails.`,
            variant: 'destructive',
          });
        }

        setIsDialogOpen(false);
        setJsonData('');
        onImportSuccess();
      } else {
        console.error('Erreur d\'import:', result);
        let errorMessage = result.errors?.join(', ') || 'Erreur lors de l\'import';
        toast({
          title: 'Erreur',
          description: errorMessage,
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

  const handleFileImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier Excel',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/plancomptable/import', {
        method: 'POST',
        body: formData,
      });

      const result: ImportResult = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Succès',
          description: `${result.comptesCreated} compte(s) importé(s) avec succès`,
        });
        
        if (result.errors && result.errors.length > 0) {
          toast({
            title: 'Avertissements',
            description: `${result.errors.length} ligne(s) ignorée(s)`,
            variant: 'destructive',
          });
        }

        setIsDialogOpen(false);
        setSelectedFile(null);
        onImportSuccess();
      } else {
        toast({
          title: 'Erreur',
          description: result.errors?.join(', ') || 'Erreur lors de l\'import',
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

  const downloadJsonTemplate = () => {
    const template = [
      { num_compte: '4110000', libelle: 'Clients', type_compte: 'Actif' },
      { num_compte: '4010000', libelle: 'Fournisseurs', type_compte: 'Passif' },
      { num_compte: '5120000', libelle: 'Banque', type_compte: 'Actif' }
    ];

    const jsonStr = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-plan-comptable.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadExcelTemplate = () => {
    const a = document.createElement('a');
    a.href = '/api/plancomptable/template';
    a.download = 'template-plan-comptable.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const testJsonImport = async () => {
    const testData = [
      { num_compte: '9990001', libelle: 'Test Import 1', type_compte: 'Test' },
      { num_compte: '9990002', libelle: 'Test Import 2', type_compte: 'Test' },
      { num_compte: '9990003', libelle: 'Test Import 3', type_compte: 'Test' }
    ];

    setLoading(true);
    try {
      console.log('Test avec données:', testData);

      const response = await fetch('/api/plancomptable/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      console.log('Statut réponse test:', response.status);
      const result = await response.json();
      console.log('Résultat test:', result);

      if (response.ok && result.success) {
        toast({
          title: 'Test Réussi',
          description: result.message,
        });
        
        if (result.errors && result.errors.length > 0) {
          console.log('Erreurs de test:', result.errors);
        }

        onImportSuccess();
      } else {
        console.error('Erreur de test:', result);
        toast({
          title: 'Test Échoué',
          description: result.error || 'Erreur lors du test',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erreur connexion test:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion lors du test',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exampleJson = `[
  {
    "num_compte": "4110000",
    "libelle": "Clients",
    "type_compte": "Actif"
  },
  {
    "num_compte": "4010000", 
    "libelle": "Fournisseurs",
    "type_compte": "Passif"
  },
  {
    "num_compte": "5120000",
    "libelle": "Banque",
    "type_compte": "Actif"
  }
]`;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Importer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer un Plan Comptable</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="json" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="json">Import JSON</TabsTrigger>
            <TabsTrigger value="excel">Import Excel</TabsTrigger>
          </TabsList>
          
          <TabsContent value="json" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Format JSON</span>
                  <Button variant="outline" size="sm" onClick={downloadJsonTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger template
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="json-data">Données JSON</Label>
                  <Textarea
                    id="json-data"
                    placeholder={exampleJson}
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={handleJsonImport} 
                    disabled={loading || !jsonData.trim()}
                    className="w-full"
                  >
                    {loading ? 'Import en cours...' : 'Importer JSON'}
                  </Button>
                  <Button 
                    onClick={testJsonImport} 
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    Tester avec données d'exemple
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="excel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Fichier Excel</span>
                  <Button variant="outline" size="sm" onClick={downloadExcelTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger template
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="excel-file" className="cursor-pointer">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                        Cliquez pour sélectionner un fichier Excel
                      </span>
                      <Input
                        id="excel-file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Formats supportés: .xlsx, .xls
                    </p>
                  </div>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-green-600">
                      Fichier sélectionné: {selectedFile.name}
                    </p>
                  )}
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Format attendu:</h4>
                  <div className="text-sm text-blue-800">
                    <p>• Colonne A: <strong>num_compte</strong> (ex: 4110000)</p>
                    <p>• Colonne B: <strong>libelle</strong> (ex: Clients)</p>
                    <p>• Colonne C: <strong>type_compte</strong> (optionnel: Actif, Passif, etc.)</p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleFileImport} 
                  disabled={loading || !selectedFile}
                  className="w-full"
                >
                  {loading ? 'Import en cours...' : 'Importer Excel'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}