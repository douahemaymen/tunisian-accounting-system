import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface EcritureTunisienne {
  numero_compte: string;
  libelle_compte: string;
  debit: number;
  credit: number;
}

interface ResultatEcrituresTunisiennes {
  journal_comptable: string;
  date_ecriture: string;
  piece_justificative: string;
  ecritures_comptables: EcritureTunisienne[];
  equilibrage: {
    total_debit: number;
    total_credit: number;
    equilibre: boolean;
  };
}

/**
 * Génère des écritures comptables tunisiennes depuis une image de facture
 */
export async function genererEcrituresDepuisImage(
  imageFile: File
): Promise<ResultatEcrituresTunisiennes> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  // Convertir l'image en base64
  const arrayBuffer = await imageFile.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  const prompt = `Tu es un expert-comptable tunisien. Analyse cette facture et génère les écritures comptables selon le Plan Comptable National (PCN) tunisien.

INSTRUCTIONS:
1. Identifie le type de facture (achat, vente, service)
2. Détermine le journal comptable approprié (J_ACH, J_VTE, J_BQ, J_OD)
3. Génère les écritures avec les comptes PCN tunisiens
4. Applique les taux de TVA tunisiens (19%, 13%, 7%)
5. Équilibre les débits et crédits

PLAN COMPTABLE TUNISIEN (PCN) - Principaux comptes:
- Classe 1: Capitaux (101000 Capital, 106000 Réserves)
- Classe 2: Immobilisations (221000 Terrains, 228000 Matériel)
- Classe 3: Stocks (310000 Marchandises, 320000 Matières premières)
- Classe 4: Tiers (401000 Fournisseurs, 411000 Clients, 436000 TVA collectée, 437000 TVA récupérable)
- Classe 5: Financiers (532000 Banque, 540000 Caisse)
- Classe 6: Charges (601000 Achats marchandises, 604000 Achats fournitures, 622000 Honoraires)
- Classe 7: Produits (701000 Ventes marchandises, 706000 Prestations services)

Réponds UNIQUEMENT avec un JSON valide (sans markdown):
{
  "journal_comptable": "J_ACH",
  "date_ecriture": "2024-01-15",
  "piece_justificative": "FA-2024-001",
  "ecritures_comptables": [
    {
      "numero_compte": "601000",
      "libelle_compte": "Achats de marchandises",
      "debit": 1000.00,
      "credit": 0
    },
    {
      "numero_compte": "437000",
      "libelle_compte": "TVA récupérable sur achats",
      "debit": 190.00,
      "credit": 0
    },
    {
      "numero_compte": "401000",
      "libelle_compte": "Fournisseurs",
      "debit": 0,
      "credit": 1190.00
    }
  ],
  "equilibrage": {
    "total_debit": 1190.00,
    "total_credit": 1190.00,
    "equilibre": true
  }
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: imageFile.type,
        data: base64
      }
    }
  ]);

  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Réponse JSON invalide de Gemini');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Valider l'équilibrage
  const totalDebit = parsed.ecritures_comptables.reduce(
    (sum: number, e: EcritureTunisienne) => sum + e.debit,
    0
  );
  const totalCredit = parsed.ecritures_comptables.reduce(
    (sum: number, e: EcritureTunisienne) => sum + e.credit,
    0
  );

  parsed.equilibrage = {
    total_debit: totalDebit,
    total_credit: totalCredit,
    equilibre: Math.abs(totalDebit - totalCredit) < 0.01
  };

  return parsed;
}

/**
 * Teste la génération d'écritures avec des données simulées
 */
export async function testerGenerationEcritures(): Promise<any> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = `Génère un exemple d'écritures comptables tunisiennes pour une facture d'achat de fournitures de bureau.

Facture simulée:
- Fournisseur: PAPETERIE MODERNE
- Montant HT: 500 TND
- TVA 19%: 95 TND
- Total TTC: 595 TND
- Date: 15/01/2024
- Référence: FA-2024-001

Utilise le Plan Comptable National tunisien (PCN).

Réponds avec un JSON valide (sans markdown):
{
  "journal_comptable": "J_ACH",
  "date_ecriture": "2024-01-15",
  "piece_justificative": "FA-2024-001",
  "ecritures_comptables": [
    {
      "numero_compte": "604000",
      "libelle_compte": "Achats de fournitures",
      "debit": 500.00,
      "credit": 0
    },
    {
      "numero_compte": "437000",
      "libelle_compte": "TVA récupérable",
      "debit": 95.00,
      "credit": 0
    },
    {
      "numero_compte": "401000",
      "libelle_compte": "Fournisseurs",
      "debit": 0,
      "credit": 595.00
    }
  ],
  "equilibrage": {
    "total_debit": 595.00,
    "total_credit": 595.00,
    "equilibre": true
  }
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Réponse JSON invalide');
  }

  return JSON.parse(jsonMatch[0]);
}
