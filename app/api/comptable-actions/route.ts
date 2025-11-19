import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/* ============================================================
   GET : LISTER TOUS LES COMPTABLES AVEC LEURS CLIENTS
   ============================================================ */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const comptables = await prisma.comptable.findMany({
      include: {
        user: true,
        clients: true,
      },
    });

    // Ajouter le _count pour les clients
    const comptablesWithCount = comptables.map(c => ({
      ...c,
      _count: { clientsGeres: c.clients.length },
    }));

    return NextResponse.json(
      { message: 'Liste des comptables récupérée avec succès.', comptables: comptablesWithCount },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur GET comptables:', error);
    return NextResponse.json({ message: 'Erreur interne lors de la récupération des comptables.' }, { status: 500 });
  }
}

/* ============================================================
   POST : AJOUTER UN NOUVEAU COMPTABLE
   ============================================================ */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nom, societe } = body;

    if (!email || !password || password.length < 8 || !nom || !societe) {
      return NextResponse.json(
        { message: "Email, mot de passe, nom et société sont requis (mot de passe min 8)." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return NextResponse.json({ message: "Cet email est déjà utilisé." }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { email, password_hash: hashedPassword, role: 'comptable' },
      select: { id: true, email: true, createdAt: true },
    });

    const newComptable = await prisma.comptable.create({
      data: { userId: newUser.id, nom, societe },
      include: { user: true, clients: true },
    });

    return NextResponse.json({ message: "Comptable ajouté avec succès.", comptable: newComptable }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST comptable:", error);
    return NextResponse.json({ message: "Erreur interne lors de l'ajout du comptable." }, { status: 500 });
  }
}

/* ============================================================
   PATCH : MODIFIER UN COMPTABLE
   ============================================================ */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, email, newPassword, nom, societe } = body;

    if (!id || !email || !nom || !societe) {
      return NextResponse.json({ message: "ID, email, nom et société sont requis pour la mise à jour." }, { status: 400 });
    }

    const comptable = await prisma.comptable.findUnique({ where: { id }, include: { user: true } });
    if (!comptable) return NextResponse.json({ message: "Comptable non trouvé." }, { status: 404 });

    const updateUserData: any = { email };
    if (newPassword) {
      if (newPassword.length < 8) return NextResponse.json({ message: "Le mot de passe doit avoir au moins 8 caractères." }, { status: 400 });
      updateUserData.password_hash = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({ where: { id: comptable.userId }, data: updateUserData });

    const updatedComptable = await prisma.comptable.update({
      where: { id },
      data: { nom, societe },
      include: { user: true, clients: true },
    });

    return NextResponse.json({ message: "Comptable mis à jour avec succès.", comptable: updatedComptable }, { status: 200 });
  } catch (error) {
    console.error("Erreur PATCH comptable:", error);
    return NextResponse.json({ message: "Erreur interne lors de la modification du comptable." }, { status: 500 });
  }
}

/* ============================================================
   DELETE : SUPPRIMER UN COMPTABLE + DÉTACHER SES CLIENTS
   ============================================================ */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID du comptable requis." }, { status: 400 });

    const comptable = await prisma.comptable.findUnique({ where: { id }, include: { clients: true } });
    if (!comptable) return NextResponse.json({ message: "Comptable non trouvé." }, { status: 404 });

    // Détacher les clients
    await prisma.client.updateMany({ where: { comptableId: id }, data: { comptableId: null } });
    await prisma.comptable.delete({ where: { id } });
    await prisma.user.delete({ where: { id: comptable.userId } });

    return NextResponse.json({ message: "Comptable supprimé avec succès et clients détachés." }, { status: 200 });
  } catch (error) {
    console.error("Erreur DELETE comptable:", error);
    return NextResponse.json({ message: "Erreur interne lors de la suppression du comptable." }, { status: 500 });
  }
}
