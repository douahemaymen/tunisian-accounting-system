'use client';

import React, { useState, useEffect, useCallback} from 'react';
// Types (Assurez-vous que le chemin et le contenu de ces fichiers sont corrects)
import type { Facture } from '@/lib/types'; 
import { JournalType, FactureType } from '@/lib/types'; 
import { Icon } from '@/components/factureupload/Icons';
import {  formatDate } from '@/components/factureupload/format';

// Utility: BigInt serialization replacer (Pour la requête POST, si besoin d'exporter)
export const safeStringify = (key: string, value: any) => 
  typeof value === 'bigint' ? value.toString() : value;

// Interfaces d'extraction (pour le formulaire)
export interface ExtractedFactureData {
  fournisseur: string;
  date: string;
  reference: string;
  total_ht: number;
  total_ttc: number;
  total_tva: number;
  taux_tva: number; // Utilisé dans le formulaire, mais pas nécessairement dans Facture
  type_facture: FactureType;
}

// Tab configuration
export const TABS = [
  { id: JournalType.ACHATS, label: 'Achats', icon: 'cart' },
  { id: JournalType.VENTES, label: 'Ventes', icon: 'sale' },
  { id: JournalType.BANQUE, label: 'Banque', icon: 'note' }
];

// ============= 1. JournalTable Component (Tableau de liste) =============

/**
 * Affiche la liste des factures pour un journal donné.
 */
export const JournalTable: React.FC<{ 
  data: Facture[];
  type: JournalType;
  onEdit: (item: Facture) => void;
  onDelete: (id: string) => Promise<void>; 
}> = ({ data, type, onEdit, onDelete }) => {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Icon name="note" className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg">Aucune donnée disponible pour ce journal et cette période.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Référence</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {type === JournalType.ACHATS ? 'Fournisseur' : 'Client'}
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map(item => {
            // CORRECTION: Vérifiez que l'ID est défini avant de rendre l'élément.
            if (!item.id) return null; 

            return (
              <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                {/* L'erreur est résolue ici et dans onDelete ci-dessous */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {formatDate(item.date || String(item.created_at))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                    {item.type_facture || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                  {item.reference}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {item.fournisseur}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {item.total_ttc?.toFixed(2) || '0.00'}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">TND</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'VALIDATED' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status === 'VALIDATED' ? '✓ Validée' : '⏱ En attente'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => item.image_url && window.open(item.image_url, '_blank')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Voir"
                    >
                      <Icon name="eye" className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onEdit(item)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Icon name="edit" className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onDelete(item.id)} // <--- item.id est maintenant garanti d'être string
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Icon name="trash" className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============= 2. DataExtractionForm Component (Formulaire de saisie/modification) =============

/**
 * Formulaire pour vérifier ou saisir les données extraites d'une facture.
 */
export const DataExtractionForm: React.FC<{
  initialData: Partial<ExtractedFactureData>;
  journalType: JournalType;
  onSave: (data: Partial<ExtractedFactureData>) => void;
  onCancel: () => void;
}> = ({ initialData, journalType, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    ...initialData,
    total_ht: parseFloat(String(initialData.total_ht || 0)),
    taux_tva: parseFloat(String((initialData as any).taux_tva || 19)), 
    montant_tva: parseFloat(String(initialData.total_tva || 0)),
    total_ttc: parseFloat(String(initialData.total_ttc || 0)),
    type_facture: initialData.type_facture || FactureType.SERVICES,
  });

  // Logique de recalcul automatique de la TVA et du TTC
  const recalculate = useCallback((data: any) => {
    const ht = parseFloat(data.total_ht || 0);
    const taux = parseFloat(data.taux_tva || 0);
    const tva = ht * (taux / 100);
    const ttc = ht + tva;
    return { ...data, montant_tva: tva, total_tva: tva, total_ttc: ttc };
  }, []);

  useEffect(() => {
    // Recalculer au montage ou si les données initiales changent
    setFormData(prev => recalculate(prev));
  }, [recalculate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    const updated = { ...formData, [name]: newValue };
    setFormData(['total_ht', 'taux_tva'].includes(name) ? recalculate(updated) : updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            name="date"
            type="date"
            value={String(formData.date)?.split('T')[0] || ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Référence</label>
          <input
            name="reference"
            value={formData.reference || ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type de Document</label>
          <select
            name="type_facture"
            value={formData.type_facture || ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value={FactureType.MARCHANDISES}>Marchandises/Matières</option>
            <option value={FactureType.SERVICES}>Services/Charges</option>
            <option value={FactureType.IMMOBILISATION}>Immobilisation</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {journalType === JournalType.ACHATS ? 'Fournisseur' : 'Client'}
        </label>
        <input
          name="fournisseur"
          value={formData.fournisseur || ''}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total HT (TND)</label>
          <input
            name="total_ht"
            type="number"
            value={formData.total_ht || ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Taux TVA (%)</label>
          <input
            name="taux_tva"
            type="number"
            value={formData.taux_tva || 0}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Montant TVA (TND)</label>
          <input
            name="montant_tva"
            type="number"
            value={formData.montant_tva?.toFixed(2) || ''}
            readOnly
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-blue-900 mb-2">Total TTC (TND)</label>
        <div className="text-3xl font-bold text-blue-900">
          {formData.total_ttc?.toFixed(2) || '0.00'} TND
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
};


// ============= 3. JournalTypeSelection Component (Choix du type de journal) =============

/**
 * Affiche les boutons pour choisir le type de journal (Achats, Ventes, Banque).
 */
export const JournalTypeSelection: React.FC<{ onSelect: (type: JournalType) => void }> = ({ onSelect }) => (
  <div className="p-8">
    <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">
      Sélectionnez le type de document
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className="group p-8 border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300 flex flex-col items-center gap-4"
        >
          <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
            <Icon name={tab.icon as any} className="w-10 h-10 text-blue-600" />
          </div>
          <span className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  </div>
);