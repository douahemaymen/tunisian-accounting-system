import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { genererEcrituresDepuisImage, testerGenerationEcritures } from '@/lib/ecriture-rapide-tunisie';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log('🇹🇳 API Génération écritures comptables tunisiennes');

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image de facture requise' },
        { status: 400 }
      );
    }

    console.log(`📄 Traitement image: ${imageFile.name} (${imageFile.size} bytes)`);

    const startTime = Date.now();
    
    // Générer les écritures avec Gemini 2.5 Flash
    const ecrituresTunisiennes = await genererEcrituresDepuisImage(imageFile);
    
    const generationTime = Date.now() - startTime;

    console.log(`✅ Écritures générées en ${generationTime}ms`);
    console.log(`📊 ${ecrituresTunisiennes.ecritures_comptables.length} écritures | Journal: ${ecrituresTunisiennes.journal_comptable}`);

    return NextResponse.json({
      success: true,
      ecritures: ecrituresTunisiennes,
      metadata: {
        generationTime,
        model: 'gemini-2.5-flash-lite',
        planComptable: 'PCN Tunisien',
        equilibre: ecrituresTunisiennes.equilibrage.equilibre
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur génération écritures tunisiennes:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération des écritures tunisiennes',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// GET pour tester le système
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const testMode = searchParams.get('test');

    if (testMode === 'simulation') {
      console.log('🧪 Test simulation écritures tunisiennes');
      
      const simulationResult = await testerGenerationEcritures();
      
      return NextResponse.json({
        success: true,
        test: 'simulation',
        result: simulationResult,
        message: 'Simulation des écritures comptables tunisiennes réussie'
      });
    }

    return NextResponse.json({
      message: 'API Génération Écritures Comptables Tunisiennes',
      endpoints: {
        POST: 'Générer écritures depuis image de facture',
        'GET?test=simulation': 'Tester avec données simulées'
      },
      features: [
        'Analyse directe d\'image avec Gemini 2.5 Flash',
        'Plan Comptable National tunisien (PCN)',
        'Génération automatique comptes et libellés',
        'Équilibrage automatique des écritures',
        'Support TVA tunisienne (19%, 13%, 7%)',
        'Journaux comptables tunisiens'
      ],
      planComptable: 'PCN - Plan Comptable National Tunisien'
    });

  } catch (error: any) {
    console.error('❌ Erreur test:', error);
    return NextResponse.json(
      { error: 'Erreur lors du test', details: error.message },
      { status: 500 }
    );
  }
}