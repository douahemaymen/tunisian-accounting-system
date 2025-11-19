'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

// --- INTERFACE LOCALE NETTOYÉE ---
interface JournalBanqueWithCustomFields {
    id?: string;
    date: string;
    image_url: string | null;
    
    // Seuls les champs de base sont conservés pour un Journal Banque standard
    numero: string;
}

interface ScanJournalBanqueModalProps {
    isOpen: boolean;
    onClose: () => void;
    // onSave peut recevoir un objet partiel pour gérer l'ID et l'image_url
    onSave: (journal: Partial<JournalBanqueWithCustomFields>) => Promise<void>; 
    initialData?: Partial<JournalBanqueWithCustomFields>;
    mode?: 'create' | 'edit';
}

export function ScanJournalBanqueModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    mode = 'create'
}: ScanJournalBanqueModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    
    // Utilisation de useMemo pour initialData?.image_url (conservé car bonne pratique si initialData pouvait changer souvent)
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
    
    const [formData, setFormData] = useState<Partial<JournalBanqueWithCustomFields>>({
        date: initialData?.date || new Date().toISOString().split('T')[0],
        numero: initialData?.numero || '',
        // Suppression des champs douaniers de l'état initial :
        // importateur_exportateur: initialData?.importateur_exportateur || '',
        // ... (tous les montants)
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Assurer une gestion correcte des nombres (simplifiée car plus de champs 'montant')
    const handleInputChange = (field: keyof typeof formData, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleScanDocument = async () => {
        if (!imageFile) {
            toast.error('Veuillez sélectionner une image');
            return;
        }

        setIsLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('image', imageFile);
            formDataToSend.append('type', 'journal-banque');

            // Simuler l'upload et le scan 
            const response = await fetch('/api/scan-document', {
                method: 'POST',
                body: formDataToSend,
            });

            if (!response.ok) {
                throw new Error('Erreur lors du scan du document');
            }

            const result = await response.json();
            
            if (result.success && result.data) {
                const updatedData = { ...formData };
                
                // --- Logique de mise à jour des champs (nettoyée) ---
                // Seuls la date et le numéro sont mis à jour
                if (result.data.date && result.data.date.trim() !== '') {
                    updatedData.date = result.data.date;
                }
                if (result.data.numero && result.data.numero.trim() !== '') {
                    updatedData.numero = result.data.numero;
                }
                
                // On ignore tous les autres champs douaniers renvoyés par l'API de scan
                
                setFormData(updatedData as Partial<JournalBanqueWithCustomFields>);
                
                const filledFields = Object.entries(result.data).filter(([key, value]) => {
                    // Compter seulement les champs pertinents (date, numero)
                    return (key === 'date' || key === 'numero') && typeof value === 'string' && value.trim() !== '';
                }).length;
                
                console.log('Données reçues du scan:', result.data);
                console.log('Données mises à jour:', updatedData);
                
                if (filledFields > 0) {
                    toast.success(`Document scanné avec succès ! ${filledFields} champs détectés.`);
                } else {
                    toast.warning('Document scanné mais aucune donnée pertinente détectée.');
                }
            } else {
                toast.error(result.error || 'Impossible de scanner le document');
                if (result.debug) {
                    console.log('Debug scan:', result.debug);
                }
            }
        } catch (error) {
            console.error('Erreur scan:', error);
            toast.error('Erreur lors du scan du document');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Les champs obligatoires sont vérifiés (simplifié)
        if (!formData.numero) {
            toast.error('Veuillez remplir le champ Numéro');
            return;
        }

        setIsLoading(true);
        try {
            let imageUrl = initialData?.image_url;
            
            if (imageFile) {
                // 1. Upload de l'image
                const uploadFormData = new FormData();
                uploadFormData.append('image', imageFile);
                
                const uploadResponse = await fetch('/api/upload-image', {
                    method: 'POST',
                    body: uploadFormData,
                });
                
                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    imageUrl = uploadResult.url;
                }
            }

            // 2. Préparation des données pour la sauvegarde
            // Les données envoyées ne contiennent plus les champs douaniers
            const journalData: Partial<JournalBanqueWithCustomFields> = {
                id: initialData?.id, 
                date: formData.date,
                numero: formData.numero,
                image_url: imageUrl, 
                // Les autres champs douaniers ne sont plus inclus
            };

            await onSave(journalData);
            toast.success(mode === 'create' ? 'Journal banque créé avec succès !' : 'Journal banque modifié avec succès !');
            onClose();
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Nouveau Journal Banque' : 'Modifier Journal Banque'}
                    </DialogTitle>
                    <p className="text-sm text-gray-600 mt-2">
                        📅 Enregistrement d'une entrée de journal de banque ou caisse.
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Upload d'image */}
                    <div className="space-y-4">
                        <Label>Document (Relevé, Quittance, Chèque...)</Label>
                        <div className="flex items-center space-x-4">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="flex-1"
                            />
                            {imageFile && (
                                <Button
                                    type="button"
                                    onClick={handleScanDocument}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4" />
                                    )}
                                    <span>Scanner Document</span>
                                </Button>
                            )}
                        </div>
                        
                        {imagePreview && (
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="Aperçu du document"
                                    className="max-w-full h-48 object-contain border rounded"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                        setImagePreview(null);
                                        setImageFile(null);
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Informations générales (simplifiées) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                required
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="numero">Numéro de référence *</Label>
                            <Input
                                id="numero"
                                value={formData.numero}
                                onChange={(e) => handleInputChange('numero', e.target.value)}
                                placeholder="N° du chèque, relevé, etc."
                                required
                            />
                        </div>
                    </div>

                    {/* La section des Montants Douaniers a été complètement supprimée */}

                    {/* Actions */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sauvegarde...
                                </>
                            ) : (
                                mode === 'create' ? 'Créer' : 'Modifier'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}