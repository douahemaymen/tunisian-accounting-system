// app/api/ecritures-comptables/route.ts
import { NextRequest } from 'next/server';
import { authService } from '@/lib/services/auth.service';
import { ecritureService } from '@/lib/services/ecriture.service';
import { jsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const comptable = await authService.getComptable();
    
    const { searchParams } = new URL(request.url);
    const filters = {
      clientUid: searchParams.get('clientUid') || undefined,
      factureId: searchParams.get('factureId') || undefined,
      journalBanqueId: searchParams.get('journalBanqueId') || undefined
    };

    const ecritures = await ecritureService.getEcrituresByComptable(
      comptable.id,
      filters
    );

    return jsonResponse(ecritures);
  } catch (error: any) {
    console.error('Erreur lors de la récupération des écritures:', error);
    
    if (error.message === 'Non autorisé') {
      return errorResponse('Non autorisé', 401);
    }
    
    if (error.message === 'Comptable non trouvé') {
      return errorResponse('Comptable non trouvé', 404);
    }
    
    return errorResponse(
      'Erreur serveur lors de la récupération des écritures',
      500,
      error.message
    );
  }
}
