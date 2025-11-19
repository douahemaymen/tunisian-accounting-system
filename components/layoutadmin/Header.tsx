"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Users } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Header() {


  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" }); // Redirige après déconnexion
    } catch (error) {
      alert("Erreur lors de la déconnexion");
    }
  };

  return (
    <header className="w-full bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <Link href="/admin/comptables" className="flex items-center gap-2">
          <Users size={20} className="text-blue-600" />
          <span className="font-semibold text-gray-800 hover:text-blue-600 transition">
            Comptables
          </span>
        </Link>
      </div>

      <Button
        variant="destructive"
        className="flex items-center gap-2"
        onClick={handleLogout}
      >
        <LogOut size={16} />
        Déconnexion
      </Button>
    </header>
  );
}
