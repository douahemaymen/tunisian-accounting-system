'use client';

import { GoogleGenAI, Type } from "@google/genai";
import type { Part } from "@google/genai";
import type { Facture } from "./types";

// NOTE: Le code suppose que la classe "File" est disponible (soit côté client, soit polyfillée côté serveur Next.js)

// --- Constantes d'Optimisation (Nouvelles) ---
// Taille maximale pour les images avant envoi (réduit le temps de transfert)
const MAX_WIDTH_PIXELS = 1800; // Largeur max pour une bonne résolution OCR

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. Please set the API_KEY environment variable.");
}

// Initialisation du client Gemini
const ai = new GoogleGenAI({ apiKey: API_KEY! });

// --- Fonctions d'Utilitaires ---

/**
 * Nettoie la chaîne de caractères pour extraire le JSON valide.
 * Gère les cas où Gemini entoure le JSON de ```json...```
 * @param text La réponse brute de Gemini.
 * @returns Le JSON nettoyé sous forme de chaîne.
 */
const cleanJsonText = (text: string): string => {
  const cleaned = text.trim();
  // Vérifie si le texte commence par '```json' et se termine par '```'
  if (cleaned.startsWith('```json')) {
    const end = cleaned.lastIndexOf('```');
    return cleaned.substring(7, end > 7 ? end : cleaned.length).trim();
  }
  return cleaned;
};

/**
 * Redimensionne une image File côté client et retourne un Blob optimisé.
 * Ceci est la clé de l'amélioration de la vitesse de scan.
 * @param file Le fichier image original.
 * @returns Une Promise qui résout avec un Blob de l'image redimensionnée.
 */
const resizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Si le fichier n'est pas une image ou est déjà petit, on peut le passer directement
    if (!file.type.startsWith('image/') || file.size < 500 * 1024) { // Moins de 500KB
      resolve(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calcul du nouveau ratio pour réduire la taille si nécessaire
        let width = img.width;
        let height = img.height;
        const ratio = Math.min(MAX_WIDTH_PIXELS / width, 1);

        if (ratio < 1) {
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx!.drawImage(img, 0, 0, width, height);

        // Convertit le canvas en Blob avec une qualité réduite (0.7) pour compression
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from canvas."));
          }
        }, file.type, 0.7);
      };
      img.src = e.target!.result as string;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


// --- Fonctions de Conversion de Fichier ---

// Version côté client (navigateur) - MODIFIÉE POUR L'OPTIMISATION
const fileToGenerativePartClient = async (file: File): Promise<Part> => {
  return new Promise<Part>(async (resolve, reject) => {
    try {
      // 1. Redimensionnement / Compression pour la vitesse de transfert
      const optimizedBlob = await resizeImage(file);

      const reader = new FileReader();
      reader.onload = () => {
        // Le Blob est prêt, conversion en Base64
        const base64Data = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: optimizedBlob.type,
          },
        } as Part);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(optimizedBlob);

    } catch (error) {
      reject(error);
    }
  });
};

// Version côté serveur (Node.js)
const fileToGenerativePartServer = async (file: File): Promise<Part> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    return {
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    } as Part;
  } catch (error) {
    throw new Error(`Failed to convert file to base64 on server: ${error}`);
  }
};

// Fonction qui détecte l'environnement et utilise la bonne méthode
const fileToGenerativePart = (file: File): Promise<Part> => {
  if (typeof window === 'undefined') {
    return fileToGenerativePartServer(file);
  } else {
    return fileToGenerativePartClient(file);
  }
};

// --- Définitions des Schémas JSON ---

const factureSchema = {
  type: Type.OBJECT,
  properties: {
    type_facture: { type: Type.STRING, description: "Le type de facture: 'ordinaire' ou 'avoir'." },
    fournisseur: { type: Type.STRING, description: "Le nom du fournisseur ou du client." },
    date: { type: Type.STRING, description: "La date de la facture au format YYYY-MM-DD." },
    reference: { type: Type.STRING, description: "Le numéro ou la référence de la facture." },
    total_ht: { type: Type.NUMBER, description: "Le montant total hors taxes." },
    tva_19: { type: Type.NUMBER, description: "Le montant de la TVA à 19%." },
    tva_13: { type: Type.NUMBER, description: "Le montant de la TVA à 13%." },
    tva_7: { type: Type.NUMBER, description: "Le montant de la TVA à 7%." },
    total_tva: { type: Type.NUMBER, description: "Le montant total de la TVA." },
    total_ttc: { type: Type.NUMBER, description: "Le montant total toutes taxes comprises." },
    remise: { type: Type.NUMBER, description: "Le montant de la remise." },
    timbre_fiscal: { type: Type.NUMBER, description: "Le montant du timbre fiscal." },
  },
};

const journalBanqueSchema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING, description: "Période ou date de fin du relevé bancaire au format YYYY-MM-DD." },
    numero_compte: { type: Type.STRING, description: "Le numéro de compte ou RIB complet." },
    titulaire: { type: Type.STRING, description: "Nom du titulaire du compte (importateur/exportateur)." },
    matricule_fiscal: { type: Type.STRING, description: "Matricule fiscal ou CIN du titulaire." },
    solde_initial: { type: Type.NUMBER, description: "Solde du compte en début de période." },
    total_credits: { type: Type.NUMBER, description: "Montant total des crédits (entrées d'argent)." },
    total_debits: { type: Type.NUMBER, description: "Montant total des débits (sorties d'argent)." },
    frais_bancaires: { type: Type.NUMBER, description: "Montant des frais bancaires et de gestion." },
    commissions: { type: Type.NUMBER, description: "Montant des commissions (hors frais)." },
    total_mouvements: { type: Type.NUMBER, description: "Total des mouvements (débits + crédits)." },
    solde_final: { type: Type.NUMBER, description: "Solde du compte en fin de période." },
    mouvements: {
      type: Type.ARRAY,
      description: "La liste des transactions détaillées (mouvements) du relevé.",
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "Date du mouvement (YYYY-MM-DD)." },
          libelle: { type: Type.STRING, description: "Libellé de l'opération." },
          debit: { type: Type.NUMBER, description: "Montant au débit (sortie d'argent)." },
          credit: { type: Type.NUMBER, description: "Montant au crédit (entrée d'argent)." },
        },
      },
    },
  },
};

// Schéma combiné pour extraction facture + écritures comptables
const factureEtEcrituresSchema = {
  type: Type.OBJECT,
  properties: {
    facture: {
      type: Type.OBJECT,
      properties: factureSchema.properties,
      required: ["fournisseur", "date", "reference", "total_ht", "total_tva", "total_ttc"]
    },
    ecritures: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          num_compte: { type: Type.STRING, description: "Numéro de compte comptable tunisien" },
          libelle: { type: Type.STRING, description: "Libellé du compte comptable" },
          debit: { type: Type.NUMBER, description: "Montant au débit (0 si crédit)" },
          credit: { type: Type.NUMBER, description: "Montant au crédit (0 si débit)" }
        },
        required: ["num_compte", "libelle", "debit", "credit"]
      }
    }
  },
  required: ["facture", "ecritures"]
};

// Schéma simplifié pour les écritures comptables seules
const ecrituresComptablesSchema = {
  type: Type.OBJECT,
  properties: {
    ecritures: factureEtEcrituresSchema.properties.ecritures
  },
  required: ["ecritures"]
};


// --- Interfaces TypeScript ---

interface PlanComptable {
  id: string;
  num_compte: string;
  libelle: string;
  type_compte: string | null;
}

interface EcritureGenerated {
  num_compte: string;
  libelle: string;
  debit: number;
  credit: number;
}

interface EcrituresResult {
  ecritures: EcritureGenerated[];
}

interface FactureEtEcrituresResult {
  facture: Partial<Facture>;
  ecritures: EcritureGenerated[];
}


// --- Fonctions d'Extraction ---

export const extractInvoiceData = async (file: File): Promise<Partial<Facture>> => {
  try {
    const imagePart = await fileToGenerativePart(file);
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: {
        parts: [
          { text: "Extrait: fournisseur, date, reference, total_ht, tva_7, tva_13, tva_19, total_tva, total_ttc, remise, timbre_fiscal. Répondez UNIQUEMENT avec un JSON strict selon le schéma fourni." },
          imagePart,
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: factureSchema,
        temperature: 0.2 // Légère augmentation pour la robustesse d'extraction
      }
    });

    const text = result.text;
    if (!text) throw new Error("Réponse vide de Gemini.");

    // Utilisation de la fonction de nettoyage
    return JSON.parse(cleanJsonText(text)) as Partial<Facture>;

  } catch (error) {
    console.error("Error extracting invoice data:", error);
    throw new Error(`Failed to extract data from the invoice: ${(error as Error).message}`);
  }
};

export const extractJournalBanqueData = async (file: File): Promise<any> => {
  try {
    const imagePart = await fileToGenerativePart(file);
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: {
        parts: [
          {
            text: `Analysez ce relevé bancaire ou document douanier et extrayez les informations suivantes au format JSON. 
INSTRUCTIONS : Remplissez les champs JSON avec les données correspondantes du document. Pour les totaux, assurez-vous de faire la somme des colonnes Débit et Crédit si le document ne fournit pas de totaux clairs. Répondez UNIQUEMENT avec un JSON valide.`
          },
          imagePart,
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: journalBanqueSchema, // Utilisation du schéma corrigé
        temperature: 0.2 // Légère augmentation pour la robustesse d'extraction
      }
    });

    const text = result.text;
    if (!text) throw new Error("Réponse vide de Gemini.");

    // Utilisation de la fonction de nettoyage
    return JSON.parse(cleanJsonText(text));

  } catch (error) {
    console.error("Error extracting journal banque data:", error);
    throw new Error(`Failed to extract data from the journal banque document: ${(error as Error).message}`);
  }
};

// --- Fonctions de Comptabilité et Équilibrage ---

// Fonction simple d'équilibrage des écritures
const balanceEntries = (ecritures: EcritureGenerated[]): EcritureGenerated[] => {
  const totalDebit = ecritures.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = ecritures.reduce((sum, e) => sum + e.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);

  if (difference < 0.01) return ecritures; // Déjà équilibré (avec une petite tolérance)

  // Logique de correction (peut être améliorée)
  const corrected = [...ecritures];

  // Trouver une écriture non nulle à ajuster
  let entryToAdjust: EcritureGenerated | undefined;

  if (totalDebit > totalCredit) {
    // Il manque au crédit
    entryToAdjust = corrected.find(e => e.credit > 0);
    if (entryToAdjust) entryToAdjust.credit += difference;
  } else {
    // Il manque au débit
    entryToAdjust = corrected.find(e => e.debit > 0);
    if (entryToAdjust) entryToAdjust.debit += difference;
  }

  // Si aucune entrée n'est trouvée pour ajustement, on ne modifie pas (pour éviter des bugs)
  return corrected;
};


// --- Fonction Combinée : Extraction et Génération d'Écritures ---

export const extractInvoiceAndGenerateEntries = async (
  file: File,
  planComptable: PlanComptable[],
  typeJournal: string
): Promise<FactureEtEcrituresResult> => {
  try {
    const imagePart = await fileToGenerativePart(file);

    // Logique pour le Journal Banque (J_BQ)
    if (typeJournal === 'J_BQ') {
      const journalBanqueData = await extractJournalBanqueData(file);

      // Retourner les données complètes du journal banque (pas de conversion en facture)
      const factureData: any = {
        date: journalBanqueData.date || new Date().toISOString().slice(0, 10),
        numero_compte: journalBanqueData.numero_compte || '',
        titulaire: journalBanqueData.titulaire || 'Non spécifié',
        matricule_fiscal: journalBanqueData.matricule_fiscal || '',
        solde_initial: journalBanqueData.solde_initial || 0,
        total_credits: journalBanqueData.total_credits || 0,
        total_debits: journalBanqueData.total_debits || 0,
        frais_bancaires: journalBanqueData.frais_bancaires || 0,
        solde_final: journalBanqueData.solde_final || 0,
        mouvements: journalBanqueData.mouvements || [],
        type_journal: typeJournal
      };

      // Générer les écritures comptables avec Gemini pour le journal banque
      const ecrituresResult = await generateJournalBanqueEntries(journalBanqueData, planComptable);

      return {
        facture: factureData,
        ecritures: ecrituresResult.ecritures
      };
    }

    // Logique pour Factures (J_ACH, J_VTE)
    const comptesStr = planComptable.map(c => `${c.num_compte}: ${c.libelle}`).join('\n');

    const prompt = `Tu es un expert comptable tunisien. Analyse cette facture et génère automatiquement :
1. Les données extraites de la facture
2. Les écritures comptables correspondantes

TYPE DE JOURNAL: ${typeJournal}

PLAN COMPTABLE TUNISIEN DISPONIBLE:
${comptesStr}

INSTRUCTIONS:
- Extrais TOUTES les données de la facture
- Détermine automatiquement les comptes comptables appropriés selon les normes tunisiennes
- Génère les écritures équilibrées (débit = crédit) en utilisant les montants extraits.

JSON uniquement:`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: {
        parts: [
          { text: prompt },
          imagePart,
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: factureEtEcrituresSchema,
        temperature: 0
      }
    });

    const text = result.text;
    if (!text) throw new Error("Réponse vide de Gemini");

    // Utilisation de la fonction de nettoyage
    const parsedResult = JSON.parse(cleanJsonText(text)) as FactureEtEcrituresResult;

    // Équilibrer les écritures
    parsedResult.ecritures = balanceEntries(parsedResult.ecritures);

    // Ajouter le type de journal à la facture
    parsedResult.facture.type_journal = typeJournal;

    return parsedResult;

  } catch (error: any) {
    console.error("Erreur extraction facture + écritures:", error);
    throw new Error(`Échec extraction et génération: ${error?.message}`);
  }
};

// --- Fonctions de Génération d'Écritures seules (avec cleanJsonText) ---

export const generateAccountingEntries = async (
  factureData: Partial<Facture>,
  planComptable: PlanComptable[]
): Promise<EcrituresResult> => {
  try {
    const totalTTC = factureData.total_ttc || 0;
    const totalHT = factureData.total_ht || 0;
    const totalTVA = factureData.total_tva || 0;
    const typeJournal = factureData.type_journal;

    const comptesStr = planComptable.map(c => `${c.num_compte}: ${c.libelle}`).join('\n');

    const prompt = `Tu es un expert comptable tunisien. Génère automatiquement les écritures comptables pour cette facture:
FACTURE:
- Fournisseur: ${factureData.fournisseur}
- Type: ${typeJournal}
- Total HT: ${totalHT} DT
- TVA: ${totalTVA} DT  
- Total TTC: ${totalTTC} DT

PLAN COMPTABLE DISPONIBLE:
${comptesStr}

Détermine automatiquement les comptes appropriés selon les normes comptables tunisiennes et génère les écritures équilibrées (débit = crédit).

JSON uniquement:`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: ecrituresComptablesSchema,
        temperature: 0
      }
    });

    const text = result.text;
    if (!text) throw new Error("Réponse vide de Gemini");

    const parsedResult = JSON.parse(cleanJsonText(text)) as EcrituresResult;
    parsedResult.ecritures = balanceEntries(parsedResult.ecritures);

    return parsedResult;

  } catch (error: any) {
    console.error("Erreur génération écritures:", error);
    throw new Error(`Échec génération écritures: ${error?.message}`);
  }
};

// Génération d'écritures comptables spécialisée pour les journaux banque
export const generateJournalBanqueEntries = async (
  journalBanqueData: any,
  planComptable: PlanComptable[]
): Promise<EcrituresResult> => {
  try {
    const comptesStr = planComptable.map(c => `${c.num_compte}: ${c.libelle}`).join('\n');

    const soldeInitial = journalBanqueData.solde_initial || 0;
    const totalCredits = journalBanqueData.total_credits || 0;
    const totalDebits = journalBanqueData.total_debits || 0;
    const fraisBancaires = journalBanqueData.frais_bancaires || 0;
    const soldeVariation = totalCredits - totalDebits;

    const prompt = `Tu es un expert comptable tunisien. Génère automatiquement les écritures comptables pour ce journal banque:

JOURNAL BANQUE:
- Titulaire: ${journalBanqueData.titulaire || 'N/A'}
- Numéro de compte: ${journalBanqueData.numero_compte || 'N/A'}
- Type: Journal Banque (J_BQ)
- Solde initial: ${soldeInitial} DT
- Total crédits (entrées): ${totalCredits} DT
- Total débits (sorties): ${totalDebits} DT
- Variation nette: ${soldeVariation} DT
- Frais bancaires: ${fraisBancaires} DT

PLAN COMPTABLE DISPONIBLE:
${comptesStr}

Détermine automatiquement les comptes appropriés selon les normes comptables tunisiennes et génère les écritures équilibrées (débit = crédit).

RÈGLES SPÉCIFIQUES POUR JOURNAL BANQUE:
- Utilise les comptes de classe 5 (Comptes financiers) pour la banque (ex: 532100 - Banque)
- Pour les entrées (crédits): Débit Banque, Crédit compte approprié (clients, produits, etc.)
- Pour les sorties (débits): Débit compte approprié (fournisseurs, charges, etc.), Crédit Banque
- Pour les frais bancaires: Débit 627000 (Frais bancaires), Crédit Banque

JSON uniquement:`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: ecrituresComptablesSchema,
        temperature: 0
      }
    });

    const text = result.text;
    if (!text) throw new Error("Réponse vide de Gemini");

    const parsedResult = JSON.parse(cleanJsonText(text)) as EcrituresResult;
    parsedResult.ecritures = balanceEntries(parsedResult.ecritures);

    return parsedResult;

  } catch (error: any) {
    console.error("Erreur génération écritures journal banque:", error);
    throw new Error(`Échec génération écritures journal banque: ${error?.message}`);
  }
};

// Fonction de compatibilité existante
export const generateBankAccountingEntries = async (
  journalBanqueData: any,
  planComptable: PlanComptable[]
): Promise<EcrituresResult> => {
  return generateJournalBanqueEntries(journalBanqueData, planComptable);
};