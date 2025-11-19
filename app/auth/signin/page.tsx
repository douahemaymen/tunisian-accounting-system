'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/');
      } else {
        // Messages d'erreur lisibles
        let message = '';
        switch (result?.error) {
          case 'CredentialsSignin':
            message = 'Email ou mot de passe incorrect.';
            break;
          case 'EmailRequired':
            message = 'Veuillez saisir votre email.';
            break;
          case 'PasswordRequired':
            message = 'Veuillez saisir votre mot de passe.';
            break;
          default:
            message = result?.error || 'Erreur lors de la connexion.';
        }
        setErrorMessage(message);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setErrorMessage('Erreur réseau. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">ComptaPro</CardTitle>
          <p className="text-slate-600 mt-2">Connectez-vous à votre espace comptable</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 px-4 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                placeholder="votre@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 px-4 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Affichage des erreurs */}
            {errorMessage && (
              <p className="text-red-600 text-sm font-medium">{errorMessage}</p>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
