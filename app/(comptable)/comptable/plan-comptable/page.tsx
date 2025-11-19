'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Search, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PlanComptableImport from '@/components/plan-comptable-import';

interface PlanComptable {
  id: string;
  num_compte: string;
  libelle: string;
  type_compte: string | null;
}

const TYPES_COMPTE = [
  'Actif',
  'Passif',
  'Charge',
  'Produit',
  'Capitaux propres'
];

export default function PlanComptablePage() {
  const [comptes, setComptes] = useState<PlanComptable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompte, setEditingCompte] = useState<PlanComptable | null>(null);
  const [formData, setFormData] = useState({
    num_compte: '',
    libelle: '',
    type_compte: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchComptes();
  }, []);

  const fetchComptes = async () => {
    try {
      const response = await fetch('/api/plancomptable');
      if (response.ok) {
        const data = await response.json();
        setComptes(data);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le plan comptable',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.num_compte || !formData.libelle) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingCompte
        ? `/api/plancomptable/${editingCompte.id}`
        : '/api/plancomptable';

      const method = editingCompte ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: editingCompte
            ? 'Compte modifié avec succès'
            : 'Compte créé avec succès',
        });

        setIsDialogOpen(false);
        setEditingCompte(null);
        setFormData({ num_compte: '', libelle: '', type_compte: '' });
        fetchComptes();
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Une erreur est survenue',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (compte: PlanComptable) => {
    setEditingCompte(compte);
    setFormData({
      num_compte: compte.num_compte,
      libelle: compte.libelle,
      type_compte: compte.type_compte || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/plancomptable/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Compte supprimé avec succès',
        });
        fetchComptes();
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Impossible de supprimer ce compte',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive',
      });
    }
  };

  const handleInitPlanComptable = async () => {
    if (!confirm('Voulez-vous initialiser le plan comptable avec les comptes standards ? Cette action ne peut pas être annulée.')) {
      return;
    }

    try {
      const response = await fetch('/api/plancomptable/init', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Succès',
          description: `Plan comptable initialisé avec ${data.comptesCreated} comptes`,
        });
        fetchComptes();
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Erreur lors de l\'initialisation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive',
      });
    }
  };

  const handleExport = (format: 'excel' | 'json') => {
    const a = document.createElement('a');
    a.href = `/api/plancomptable/export?format=${format}`;
    a.download = `plan-comptable.${format === 'excel' ? 'xlsx' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredComptes = comptes.filter(compte =>
    compte.num_compte.toLowerCase().includes(searchTerm.toLowerCase()) ||
    compte.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (compte.type_compte && compte.type_compte.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({ num_compte: '', libelle: '', type_compte: '' });
    setEditingCompte(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Plan Comptable</CardTitle>
            <div className="flex space-x-2">
              {comptes.length === 0 && (
                <Button variant="outline" onClick={handleInitPlanComptable}>
                  Initialiser le plan comptable
                </Button>
              )}
              <PlanComptableImport onImportSuccess={fetchComptes} />
              {comptes.length > 0 && (
                <>
                  <Button variant="outline" onClick={() => handleExport('excel')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('json')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                </>
              )}
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Compte
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCompte ? 'Modifier le compte' : 'Nouveau compte'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="num_compte">Numéro de compte *</Label>
                      <Input
                        id="num_compte"
                        value={formData.num_compte}
                        onChange={(e) => setFormData({ ...formData, num_compte: e.target.value })}
                        placeholder="ex: 4110000"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="libelle">Libellé *</Label>
                      <Input
                        id="libelle"
                        value={formData.libelle}
                        onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                        placeholder="ex: Clients"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type_compte">Type de compte</Label>
                      <Select
                        value={formData.type_compte}
                        onValueChange={(value) => setFormData({ ...formData, type_compte: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPES_COMPTE.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingCompte ? 'Modifier' : 'Créer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par numéro, libellé ou type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro de compte</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Type de compte</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComptes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      {searchTerm ? 'Aucun compte trouvé' : 'Aucun compte dans le plan comptable'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComptes.map((compte) => (
                    <TableRow key={compte.id}>
                      <TableCell className="font-medium">{compte.num_compte}</TableCell>
                      <TableCell>{compte.libelle}</TableCell>
                      <TableCell>{compte.type_compte || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(compte)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(compte.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Total: {filteredComptes.length} compte(s)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}