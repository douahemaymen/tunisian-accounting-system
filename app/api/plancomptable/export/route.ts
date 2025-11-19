import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';

// GET - Exporter le plan comptable en Excel ou JSON
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

    // Récupérer le plan comptable
    const planComptable = await prisma.planComptable.findMany({
      where: { comptableId: comptable.id },
      orderBy: { num_compte: 'asc' },
      select: {
        num_compte: true,
        libelle: true,
        type_compte: true
      }
    });

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'excel';

    if (format === 'json') {
      // Export JSON
      return NextResponse.json(planComptable, {
        headers: {
          'Content-Disposition': 'attachment; filename="plan-comptable.json"'
        }
      });
    } else {
      // Export Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(planComptable);
      
      // Ajuster la largeur des colonnes
      const colWidths = [
        { wch: 15 }, // num_compte
        { wch: 40 }, // libelle
        { wch: 20 }  // type_compte
      ];
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Plan Comptable');
      
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'buffer' 
      });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="plan-comptable.xlsx"'
        }
      });
    }

  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export' },
      { status: 500 }
    );
  }
}