// app/api/journal-banque/route.ts
import { NextRequest } from 'next/server';
import { journalService } from '@/lib/services/journal.service';
import { journalValidator } from '@/lib/validators/journal.validator';
import { jsonResponse, errorResponse, successResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    const validation = journalValidator.validateCreateJournal(data);
    if (!validation.isValid) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const journal = await journalService.createJournalBanqueWithEcritures(data);
    return jsonResponse(journal, 201);
  } catch (error: any) {
    console.error('Erreur POST journal banque:', error);
    return errorResponse(error.message || 'Erreur lors de la création du journal de banque', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      clientUid: searchParams.get('clientUid')!,
      status: searchParams.get('status') || undefined
    };

    console.log('📥 GET /api/journal-banque - Filters:', filters);

    const validation = journalValidator.validateFilters(filters);
    if (!validation.isValid) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const journaux = await journalService.getJournals('banque', filters);
    console.log('✅ Journaux banque récupérés:', journaux.length);
    
    // Ajouter le type_journal si manquant
    const journauxWithType = journaux.map(j => ({
      ...j,
      type_journal: j.type_journal || 'J_BQ'
    }));
    
    return jsonResponse(journauxWithType);
  } catch (error: any) {
    console.error('Erreur GET journaux banque:', error);
    return errorResponse('Échec de la récupération des journaux de banque', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    const validation = journalValidator.validateUpdateJournal(data);
    if (!validation.isValid) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const { id, ...fields } = data;
    const updated = await journalService.updateJournal('banque', id, fields);
    return jsonResponse(updated);
  } catch (error: any) {
    console.error('Erreur PUT journal banque:', error);
    return errorResponse(error.message || 'Échec de la mise à jour', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return errorResponse('ID manquant pour la suppression', 400);
    }

    await journalService.deleteJournal('banque', id);
    return successResponse({}, `Journal de banque ${id} supprimé avec succès`);
  } catch (error: any) {
    console.error('Erreur DELETE journal banque:', error);
    return errorResponse(error.message || 'Échec de la suppression', 500);
  }
}
