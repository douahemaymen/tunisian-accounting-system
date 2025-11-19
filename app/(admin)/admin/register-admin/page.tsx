// /app/register-admin/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Shield, Loader2 } from 'lucide-react'; 

export default function RegisterAdminPage() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Appel au Route Handler API
            const response = await fetch('/api/register-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            
            const data = await response.json();

            if (response.ok) {
                // Succès : Redirection vers la page de connexion ou le tableau de bord
                alert(data.message);
                router.push('/login'); 
            } else {
                // Échec : Afficher l'erreur retournée par l'API
                setError(data.message || 'Échec de l\'enregistrement.');
            }
        } catch (err) {
            console.error(err);
            setError('Erreur réseau. Impossible de contacter le serveur.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <Shield className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <CardTitle className="text-2xl">Enregistrement Administrateur</CardTitle>
                    <p className="text-sm text-gray-500">
                        Créez le premier compte administrateur principal.
                    </p>
                </CardHeader>
                <CardContent>
                    
                    {error && (
                        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Champ Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Adresse Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="admin@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Champ Mot de Passe */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder="Minimum 8 caractères"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                'Créer le Compte Admin'
                            )}
                        </Button>
                    </form>
                    
                </CardContent>
            </Card>
        </div>
    );
}