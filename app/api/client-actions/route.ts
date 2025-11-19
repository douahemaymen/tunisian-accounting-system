import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

interface ClientBody {
  nom?: string;
  societe?: string;
  email?: string;
  password?: string;
  statut?: string;
  userId?: string; // User ID du comptable
  uid?: string;    // UID du client pour PATCH/DELETE
  newPassword?: string;
}

// ============================================================
// GET : Liste des clients d’un comptable
// ============================================================
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "User ID du comptable requis." }, { status: 400 });
    }

    const comptable = await prisma.comptable.findUnique({
      where: { userId },
    });

    if (!comptable) {
      return NextResponse.json({ message: "Comptable introuvable." }, { status: 404 });
    }

    const clients = await prisma.client.findMany({
      where: { comptableId: comptable.id },
      select: {
        uid: true,
        nom: true,
        societe: true,
        email: true,
        statut: true,
      },
    });

    return NextResponse.json({ message: "Clients récupérés.", clients }, { status: 200 });
  } catch (error) {
    console.error("Erreur GET clients:", error);
    return NextResponse.json({ message: "Erreur interne." }, { status: 500 });
  }
}

// ============================================================
// POST : Ajouter un client
// ============================================================
export async function POST(request: Request) {
  try {
    const body: ClientBody = await request.json();
    const { nom, societe, email, password, userId, statut } = body;

    if (!nom || !societe || !email || !userId) {
      return NextResponse.json(
        { message: "Nom, Société, Email et User ID du comptable sont obligatoires." },
        { status: 400 }
      );
    }

    const comptable = await prisma.comptable.findUnique({ where: { userId } });
    if (!comptable) {
      return NextResponse.json({ message: "Comptable introuvable." }, { status: 404 });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Cet email existe déjà." }, { status: 400 });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : "";

    const newUser = await prisma.user.create({
      data: { email, password_hash: hashedPassword, role: "client" },
    });

    const newClient = await prisma.client.create({
      data: {
        uid: newUser.id,
        userId: newUser.id,
        nom,
        societe,
        email,
        statut: statut || "ACTIF",
        comptableId: comptable.id,
      },
    });

    return NextResponse.json(
      { message: "Client ajouté avec succès.", client: newClient },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur POST client:", error);

    // Gérer les erreurs uniques restantes
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return NextResponse.json({ message: "Cet email existe déjà." }, { status: 400 });
    }

    return NextResponse.json({ message: "Erreur interne." }, { status: 500 });
  }
}


// ============================================================
// PATCH : Modifier un client
// ============================================================
export async function PATCH(request: Request) {
  try {
    const body: ClientBody = await request.json();
    const { uid, nom, societe, email, statut, newPassword } = body;

    if (!uid || !nom || !societe || !email) {
      return NextResponse.json(
        { message: "UID, Nom, Société et Email sont requis." },
        { status: 400 }
      );
    }

    // Mise à jour du client
    const updatedClient = await prisma.client.update({
      where: { uid },
      data: { nom, societe, email, statut },
    });

    // Mise à jour du User associé
    const updateUserData: any = { email };
    if (newPassword && newPassword.length >= 8) {
      updateUserData.password_hash = await bcrypt.hash(newPassword, 10);
    }
    await prisma.user.update({ where: { id: uid }, data: updateUserData });

    return NextResponse.json({ message: "Client mis à jour avec succès.", client: updatedClient }, { status: 200 });
  } catch (error) {
    console.error("Erreur PATCH client:", error);
    return NextResponse.json({ message: "Erreur interne." }, { status: 500 });
  }
}

// ============================================================
// DELETE : Supprimer un client
// ============================================================
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const uid = url.searchParams.get("uid");
    if (!uid) return NextResponse.json({ message: "UID du client requis." }, { status: 400 });

    // Supprime le client et l’utilisateur associé
    await prisma.client.delete({ where: { uid } });
    await prisma.user.delete({ where: { id: uid } });

    return NextResponse.json({ message: "Client supprimé avec succès." }, { status: 200 });
  } catch (error) {
    console.error("Erreur DELETE client:", error);
    return NextResponse.json({ message: "Erreur interne." }, { status: 500 });
  }
}
