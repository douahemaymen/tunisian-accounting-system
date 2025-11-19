// /app/api/register-admin/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assurez-vous que le chemin est correct
import bcrypt from 'bcryptjs';

// Gère les requêtes POST vers /api/register-admin
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Validation de base
    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { message: 'Email et mot de passe (min. 8 caractères) sont requis.' },
        { status: 400 } // Bad Request
      );
    }

    // 2. Vérification de l'existence d'un administrateur
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Un compte administrateur principal existe déjà.' },
        { status: 403 } // Forbidden
      );
    }

    // 3. Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Création de l'utilisateur avec le rôle 'admin'
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password_hash: hashedPassword,
        role: 'admin', // Rôle défini
        // clientUid et client sont null
      },
      select: { email: true, role: true, id: true } // Ne pas retourner le hash du mot de passe
    });

    // 5. Succès
    return NextResponse.json(
      { message: 'Compte administrateur créé avec succès.', user: newUser },
      { status: 201 } // Created
    );

  } catch (error) {
    console.error('Erreur lors de l’enregistrement de l\'administrateur:', error);
    // Gérer spécifiquement l'erreur d'unicité (email déjà utilisé) si nécessaire
    return NextResponse.json(
      { message: 'Une erreur interne est survenue lors de l\'enregistrement.' },
      { status: 500 }
    );
  }
}