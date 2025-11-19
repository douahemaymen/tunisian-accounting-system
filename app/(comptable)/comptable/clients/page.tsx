"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Trash2, Pencil, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Client {
  uid: string;
  nom: string;
  societe: string;
  email?: string;
  statut?: string;
}

export default function ComptableClientsPage() {
  const { data: session, status } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    societe: "",
    email: "",
    statut: "ACTIF",
    password: "",
  });

  const userId = session?.user?.role === "comptable" ? session.user.id : null;

  // Récupérer les clients
  useEffect(() => {
    if (!userId) return;

    const fetchClients = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/client-actions?userId=${userId}`);
        const data = await res.json();
        if (res.ok) setClients(data.clients);
        else toast.error(data.message || "Erreur de chargement.");
      } catch {
        toast.error("Erreur réseau.");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [userId]);

  if (status === "loading") return <p className="text-center py-10">Chargement...</p>;
  if (!session) return <p className="text-center py-10">Non connecté</p>;
  if (!userId) return <p className="text-center py-10">Non autorisé</p>;

  const openDialog = (client?: Client) => {
    if (client) {
      setEditClient(client);
      setFormData({
        nom: client.nom,
        societe: client.societe,
        email: client.email || "",
        statut: client.statut || "ACTIF",
        password: "",
      });
    } else {
      setEditClient(null);
      setFormData({ nom: "", societe: "", email: "", statut: "ACTIF", password: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim() || !formData.societe.trim()) {
      toast.error("Nom et Société sont obligatoires.");
      return;
    }

    try {
      setLoading(true);
      const method = editClient ? "PATCH" : "POST";

      const body = editClient
        ? {
            uid: editClient.uid,
            nom: formData.nom,
            societe: formData.societe,
            email: formData.email,
            statut: formData.statut,
          }
        : {
            nom: formData.nom,
            societe: formData.societe,
            email: formData.email,
            statut: formData.statut,
            userId, // UserId du comptable
            password: formData.password || "client123", // mot de passe par défaut si vide
          };

      const res = await fetch("/api/client-actions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setIsDialogOpen(false);
        setFormData({ nom: "", societe: "", email: "", statut: "ACTIF", password: "" });
        setEditClient(null);

        // Recharger clients
        const refreshed = await fetch(`/api/client-actions?userId=${userId}`);
        const refreshedData = await refreshed.json();
        if (refreshed.ok) setClients(refreshedData.clients);
      } else toast.error(data.message || "Erreur lors de l'enregistrement.");
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Supprimer ce client ?")) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/client-actions?uid=${uid}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) toast.success(data.message);
      else toast.error(data.message || "Erreur lors de la suppression.");
      setClients(prev => prev.filter(c => c.uid !== uid));
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mes Clients</h1>
          <Button onClick={() => openDialog()} className="gap-2">
            <PlusCircle size={18} /> Nouveau Client
          </Button>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
        {!loading && clients.length === 0 && <p className="text-center text-gray-500">Aucun client trouvé.</p>}

        {!loading && clients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 bg-white rounded-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Nom</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Société</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Statut</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.uid} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{c.nom}</td>
                    <td className="px-4 py-2">{c.societe}</td>
                    <td className="px-4 py-2">{c.email || "-"}</td>
                    <td className="px-4 py-2">{c.statut}</td>
                    <td className="px-4 py-2 flex justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(c)}><Pencil size={16} /></Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(c.uid)}><Trash2 size={16} /></Button>
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
              <DialogTitle>{editClient ? "Modifier Client" : "Nouveau Client"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nom</label>
                  <Input
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Société</label>
                  <Input
                    value={formData.societe}
                    onChange={e => setFormData({ ...formData, societe: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {!editClient && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Mot de passe</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mot de passe du client"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Statut</label>
                <Input
                  value={formData.statut}
                  onChange={e => setFormData({ ...formData, statut: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="animate-spin mr-2" size={16} />}
                  {editClient ? "Enregistrer" : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
