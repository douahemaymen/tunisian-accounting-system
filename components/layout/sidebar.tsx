'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Calculator,
  Receipt,
  Building,
  Settings,
  Menu,
  X,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  userRole: 'comptable' | 'client';
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminItems = [
    { href: '/comptable/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/comptable/clients', label: 'Clients', icon: Users },
    { href: '/comptable/factures', label: 'Factures', icon: FileText },
    { href: '/comptable/plan-comptable', label: 'Plan Comptable', icon: BookOpen },
    { href: '/comptable/ecritures-comptables', label: 'Écritures Comptables', icon: Calculator },
    { href: '/comptable/comptabilite', label: 'Comptabilité', icon: Receipt },
  ];

  const clientItems = [
    { href: '/client/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/client/factures', label: 'Factures', icon: Receipt },
  ];

  const items = userRole === 'comptable' ? adminItems : clientItems;

  const SidebarContent = () => (
    <>
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">ComptaPro</h2>
            <p className="text-xs sm:text-sm text-slate-500 capitalize">{userRole}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 sm:p-4">
        <ul className="space-y-1 sm:space-y-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 group text-sm sm:text-base',
                    isActive
                      ? 'bg-violet-100 text-violet-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <item.icon 
                    className={cn(
                      'h-4 w-4 sm:h-5 sm:w-5 transition-colors flex-shrink-0',
                      isActive ? 'text-violet-600' : 'text-slate-500 group-hover:text-slate-700'
                    )} 
                  />
                  <span className="font-medium truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2 sm:p-4 border-t border-slate-200">
        <Link
          href="/settings"
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 text-sm sm:text-base"
        >
          <Settings className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span className="font-medium truncate">Paramètres</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-slate-600" />
        ) : (
          <Menu className="h-5 w-5 text-slate-600" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        "lg:hidden fixed top-0 left-0 w-64 h-full bg-white border-r border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </div>
    </>
  );
}