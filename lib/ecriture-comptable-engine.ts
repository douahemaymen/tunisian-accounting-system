import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface FactureData {
  fournisseur: string;
  type_journal?: string;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  reference: string;
  date: string | Date;
}

interface EcritureComptable {
  compte: string;
  libelle: string;
  debit: number;
  credit: number;
}

interface GenerationResult {
  ecritures: EcritureComptable[];
  methode_generation: 'gemini' | 'regles_statiques';
  confidence?: number;
}

interface GenerationOptions {
  useGemini?: boolean;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Génère des écritures comptables avec Gemini AI ou règles statiques
 */
export async function generateEcrituresComptables(
  factureData: FactureData,
  planComptable: any[] = [],
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  const { useGemini = true, maxRetries = 2, timeout = 5000 } = options;

  // Essayer avec Gemini d'abord si activé
  if (useGemini && process.env.GEMINI_API_KEY) {
    try {
      const result = await generateWithGemini(factureData, planComptable, timeout);
      if (result && result.ecritures.length > 0) {
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Gemini failed, falling back to static rules:', error);
    }
  }

  // Fallback vers règles statiques
  return generateWithStaticRules(factureData);
}

/**
 * Génération avec Gemini AI
 */
async function generateWithGemini(
  factureData: FactureData,
  planComptable: any[],
  timeout: number
): Promise<GenerationResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = `Tu es un expert-comptable. Génère les écritures comptables pour cette facture d'achat.

FACTURE:
- Fournisseur: ${factureData.fournisseur}
- Référence: ${factureData.reference}
- Date: ${factureData.date}
- Total HT: ${factureData.total_ht} €
- TVA: ${factureData.total_tva} €
- Total TTC: ${factureData.total_ttc} €

${planComptable.length > 0 ? `PLAN COMPTABLE DISPONIBLE:\n${planComptable.map(p => `${p.num_compte} - ${p.libelle}`).join('\n')}` : ''}

Réponds UNIQUEMENT avec un JSON valide (sans markdown):
{
  "ecritures": [
    {
      "compte": "607000",
      "libelle": "Achats de marchandises",
      "debit": ${factureData.total_ht},
      "credit": 0
    },
    {
      "compte": "445660",
      "libelle": "TVA déductible",
      "debit": ${factureData.total_tva},
      "credit": 0
    },
    {
      "compte": "401000",
      "libelle": "Fournisseurs",
      "debit": 0,
      "credit": ${factureData.total_ttc}
    }
  ]
}

Règles:
- Utilise le plan comptable fourni si disponible
- Équilibre débit = crédit
- Comptes standards français si plan non fourni`;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout')), timeout)
  );

  const result = await Promise.race([
    model.generateContent(prompt),
    timeoutPromise
  ]);

  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Invalid JSON response from Gemini');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    ecritures: parsed.ecritures || [],
    methode_generation: 'gemini',
    confidence: 0.9
  };
}

/**
 * Génération avec règles statiques (fallback)
 */
function generateWithStaticRules(factureData: FactureData): GenerationResult {
  const ecritures: EcritureComptable[] = [];

  // Débit: Achats
  ecritures.push({
    compte: '607000',
    libelle: `Achats - ${factureData.fournisseur}`,
    debit: factureData.total_ht,
    credit: 0
  });

  // Débit: TVA déductible
  if (factureData.total_tva > 0) {
    ecritures.push({
      compte: '445660',
      libelle: 'TVA déductible',
      debit: factureData.total_tva,
      credit: 0
    });
  }

  // Crédit: Fournisseurs
  ecritures.push({
    compte: '401000',
    libelle: `Fournisseur - ${factureData.fournisseur}`,
    debit: 0,
    credit: factureData.total_ttc
  });

  return {
    ecritures,
    methode_generation: 'regles_statiques'
  };
}
