'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Bell } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface HeaderProps {
  user: any;
}

export function Header({ user }: HeaderProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between lg:ml-0 ml-16">
      <div className="flex items-center space-x-2 sm:space-x-4">
        <h1 className="text-sm sm:text-lg font-semibold text-slate-900 truncate">
          <span className="hidden sm:inline">Bonjour, </span>
          {user.email?.split('@')[0]} 👋
        </h1>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarFallback className="bg-violet-100 text-violet-700 text-xs sm:text-sm">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="text-slate-600 hover:text-slate-900 p-2 sm:px-3"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </div>
      </div>
    </header>
  );
}