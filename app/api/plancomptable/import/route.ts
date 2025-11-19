import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';

interface ImportCompte {
  num_compte: string;
  libelle: string;
  type_compte?: string;
}

// POST - Importer des comptes depuis JSON ou Excel
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const comptable = await prisma.comptable.findUnique({
      where: { userId: session.user.id }
    });

    if (!comptable) {
      return NextResponse.json({ error: 'Comptable non trouvé' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    let comptes: ImportCompte[] = [];

    console.log('Content-Type reçu:', contentType);

    if (contentType.includes('application/json')) {
      // Import JSON
      try {
        const data = await request.json();
        console.log('Données JSON reçues:', data);
        
        // Gérer différents formats de données JSON
        if (Array.isArray(data)) {
          comptes = data;
        } else if (data.comptes && Array.isArray(data.comptes)) {
          comptes = data.comptes;
        } else if (typeof data === 'object' && data !== null) {
          // Si c'est un objet unique, le convertir en tableau
          comptes = [data];
        } else {
          throw new Error('Format JSON invalide');
        }
      } catch (jsonError) {
        console.error('Erreur parsing JSON:', jsonError);
        return NextResponse.json({ 
          error: 'Format JSON invalide',
          details: 'Vérifiez que votre JSON est un tableau d\'objets avec num_compte et libelle'
        }, { status: 400 });
      }
    } else if (contentType.includes('multipart/form-data')) {
      // Import Excel
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Mapper les données Excel vers notre format
      comptes = jsonData.map((row: any) => ({
        num_compte: String(row['num_compte'] || row['Numéro'] || row['Numero'] || '').trim(),
        libelle: String(row['libelle'] || row['Libellé'] || row['Libelle'] || '').trim(),
        type_compte: row['type_compte'] || row['Type'] || null
      })).filter(compte => compte.num_compte && compte.libelle);
    } else {
      return NextResponse.json({ error: 'Format non supporté' }, { status: 400 });
    }

    console.log('Comptes à traiter:', comptes);

    if (!Array.isArray(comptes)) {
      return NextResponse.json({ 
        error: 'Les données doivent être un tableau',
        received: typeof comptes
      }, { status: 400 });
    }

    if (comptes.length === 0) {
      return NextResponse.json({ error: 'Aucun compte trouvé dans les données' }, { status: 400 });
    }

    // Valider les données
    const errors: string[] = [];
    const validComptes: ImportCompte[] = [];

    for (let i = 0; i < comptes.length; i++) {
      const compte = comptes[i];
      
      if (!compte.num_compte || !compte.libelle) {
        errors.push(`Ligne ${i + 1}: Numéro de compte et libellé requis`);
        continue;
      }

      // Vérifier si le compte existe déjà
      const existingCompte = await prisma.planComptable.findFirst({
        where: {
          comptableId: comptable.id,
          num_compte: compte.num_compte
        }
      });

      if (existingCompte) {
        errors.push(`Ligne ${i + 1}: Le compte ${compte.num_compte} existe déjà`);
        continue;
      }

      validComptes.push(compte);
    }

    if (validComptes.length === 0) {
      return NextResponse.json({ 
        error: 'Aucun compte valide à importer',
        details: errors
      }, { status: 400 });
    }

    // Créer les comptes en batch
    const comptesCreated = await prisma.planComptable.createMany({
      data: validComptes.map(compte => ({
        comptableId: comptable.id,
        num_compte: compte.num_compte,
        libelle: compte.libelle,
        type_compte: compte.type_compte
      }))
    });

    return NextResponse.json({
      success: true,
      comptesCreated: comptesCreated.count,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'import' },
      { status: 500 }
    );
  }
}