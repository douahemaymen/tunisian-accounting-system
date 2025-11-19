"use client";

import Header from "@/components/layoutadmin/Header";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Pencil, PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface Comptable {
  id: string;
  nom: string;
  societe: string;
  user: { email: string };
  _count?: { clientsGeres: number };
}

export default function ComptablePage() {
  const [comptables, setComptables] = useState<Comptable[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editComptable, setEditComptable] = useState<Comptable | null>(null);
  const [formData, setFormData] = useState({ email: "", password: "", nom: "", societe: "" });

  const fetchComptables = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/comptable-actions");
      const data = await res.json();
      if (res.ok) setComptables(data.comptables);
      else toast.error(data.message || "Erreur de chargement.");
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComptables(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.societe.trim()) {
      toast.error("Nom et Société sont obligatoires.");
      return;
    }

    try {
      setLoading(true);
      const method = editComptable ? "PATCH" : "POST";
      const body = editComptable
        ? { id: editComptable.id, email: formData.email, newPassword: formData.password, nom: formData.nom, societe: formData.societe }
        : { email: formData.email, password: formData.password, nom: formData.nom, societe: formData.societe };

      const res = await fetch("/api/comptable-actions", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setIsDialogOpen(false);
        setFormData({ email: "", password: "", nom: "", societe: "" });
        setEditComptable(null);
        fetchComptables();
      } else toast.error(data.message || "Erreur lors de l'enregistrement.");
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce comptable ?")) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/comptable-actions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) toast.success(data.message);
      else toast.error(data.message || "Erreur lors de la suppression.");
      fetchComptables();
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (comptable?: Comptable) => {
    if (comptable) {
      setEditComptable(comptable);
      setFormData({ email: comptable.user.email, password: "", nom: comptable.nom, societe: comptable.societe });
    } else setFormData({ email: "", password: "", nom: "", societe: "" });
    setEditComptable(comptable || null);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Comptables</h1>
          <Button onClick={() => openDialog()} className="gap-2"><PlusCircle size={18} /> Nouveau Comptable</Button>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
        {!loading && comptables.length === 0 && <p className="text-center text-gray-500">Aucun comptable trouvé.</p>}

        {!loading && comptables.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 bg-white rounded-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Nom</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Société</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Clients gérés</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comptables.map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{c.nom}</td>
                    <td className="px-4 py-2">{c.societe}</td>
                    <td className="px-4 py-2">{c.user.email}</td>
                    <td className="px-4 py-2">{c._count?.clientsGeres || 0}</td>
                    <td className="px-4 py-2 flex justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(c)}><Pencil size={16} /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)}><Trash2 size={16} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editComptable ? "Modifier Comptable" : "Nouveau Comptable"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nom</label>
                  <Input value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Société</label>
                  <Input value={formData.societe} onChange={e => setFormData({ ...formData, societe: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{editComptable ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}</label>
                <Input type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editComptable} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="animate-spin mr-2" size={16} />}
                  {editComptable ? "Enregistrer" : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
