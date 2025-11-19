// types.ts
import { DefaultSession } from 'next-auth';

// NextAuth type augmentation
declare module 'next-auth' {
    interface Session {
        user: DefaultSession['user'] & {
            id: string;
            role: string;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: string;
    }
}

export enum JournalType {
    ACHATS = 'J_ACH',
    VENTES = 'J_VTE',
    BANQUE = 'J_BQ',
    CAISSE = 'J_CA',
    SALAIRE = 'J_SAL',
    OD = 'J_OD',
}

export enum FactureType {
    FOURNISSEUR = 'FOURNISSEUR',
    CLIENT = 'CLIENT',
    AVOIR = 'AVOIR',
    DEVIS = 'DEVIS',
    SERVICES = 'SERVICES',
    MARCHANDISES = 'MARCHANDISES',
    IMMOBILISATION = 'IMMOBILISATION',
    // Types spécifiques pour Journal d'Achat (Tunisie)
    FACTURE_ORDINAIRE_DT = 'FACTURE_ORDINAIRE_DT',
    FACTURE_ORDINAIRE_DEVISE = 'FACTURE_ORDINAIRE_DEVISE',
    FACTURE_AVOIR = 'FACTURE_AVOIR',
    RISTOURNE_ACHAT = 'RISTOURNE_ACHAT',
    // Types spécifiques pour Journal de Vente (Tunisie)
    VENTE_ORDINAIRE_DT = 'VENTE_ORDINAIRE_DT',
    VENTE_ORDINAIRE_DEVISE = 'VENTE_ORDINAIRE_DEVISE',
    VENTE_AVOIR = 'VENTE_AVOIR',
    RISTOURNE_VENTE = 'RISTOURNE_VENTE',
}

export interface AccountingLine {
    compte: string;
    libelle: string;
    debit: number;
    credit: number;
}

export interface JournalAchat {
    id: string;
    clientUid: string;
    type_facture: string;
    date: string;
    reference: string;
    fournisseur: string;
    
    total_ht: number;
    tva_7: number;
    tva_13: number;
    tva_19: number;
    total_tva: number;
    total_ttc: number;
    remise: number;
    timbre_fiscal: number;
    
    image_url: string; 
    created_at: bigint;
    
    accounting_entries?: any;
    status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'COMPTABILISE' | 'PROCESSED';
    
    // Relations optionnelles
    client?: {
        uid: string;
        nom: string;
        societe: string;
        email?: string;
    };
    ecritures?: EcritureComptable[];
}

// Alias pour compatibilité - Restauré avec le champ type_journal?
export interface Facture extends JournalAchat {
    type_journal?: string; // Pour compatibilité avec l'ancien code (optionnel)
}

export interface JournalVente {
    id: string;
    clientUid: string;
    type_facture: string;
    clientdefacture: string; // Client de facture
    date: string;
    reference: string;
    
    total_ht: number;
    tva_7: number;
    tva_13: number;
    tva_19: number;
    total_tva: number;
    total_ttc: number;
    remise: number;
    timbre_fiscal: number;
    
    image_url: string;
    created_at: bigint;
    
    accounting_entries?: any;
    status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'COMPTABILISE' | 'PROCESSED';
    
    // Relations optionnelles
    client?: {
        uid: string;
        nom: string;
        societe: string;
        email?: string;
    };
    ecritures?: EcritureComptable[];
}

// Alias pour compatibilité - Restauré avec les champs clientSte?, avance?, fdcs?
export interface FactureVente extends JournalVente {
    clientSte?: string; // Pour compatibilité avec l'ancien code
    avance?: number;
    fdcs?: number;
}

export interface EcritureComptable {
    id: string;
    factureId?: string;
    factureVenteId?: string;
    journalBanqueId?: string;
    planId: string;
    libelle: string;
    num_compte: string;
    date: Date;
    debit: number;
    credit: number;
    planComptable?: {
        num_compte: string;
        libelle: string;
        type_compte?: string;
    };
}

export interface PlanComptable {
    id: string;
    comptableId: string;
    num_compte: string;
    libelle: string;
    type_compte?: string;
}

// JournalBanque - Structure alignée avec le schéma Prisma
export interface JournalBanque {
    id: string;
    clientUid: string;
    date: string;
    numero_compte: string;
    titulaire: string;
    image_url?: string | null;
    created_at: bigint;
    status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'COMPTABILISE' | 'PROCESSED';
    mouvements?: MouvementJournal[];
    ecritures?: EcritureComptable[];
    client?: {
        uid: string;
        nom: string;
        societe: string;
        email?: string;
    };
}

export interface MouvementJournal {
    id: string;
    journalBanqueId: string;
    date: string;
    libelle: string;
    debit: number;
    credit: number;
}

// L'alias MouvementBanque est supprimé
// Les champs solde_initial, total_credit, total_debit, solde_final sont supprimés

export interface Mouvement extends MouvementJournal {
    banqueId?: string;
}

export interface Client {
    uid: string;
    nom: string;
    societe: string;
    email?: string;
    statut?: string;
    date_inscription?: bigint;
    comptableId?: string;
    userId?: string;
}

export interface Comptable {
    id: string;
    userId: string;
    nom: string;
    societe: string;
    createdAt: Date;
}

export interface ClientStats {
    uid: string;
    nom: string;
    societe: string;
    nombreFactures: number;
    nombreAchats: number;
    nombreVentes: number;
    nombreBanque: number;
    totalAchats: number;
    totalVentes: number;
    solde: number;
}

export interface DashboardStats {
    totalFactures: number;
    totalTTC: number;
    totalTVA: number;
    totalHT: number;
    totalAchats: number;
    totalVentes: number;
    soldeClient: number;
    nombreClients: number;
    clientsStats: ClientStats[];
    facturesParMois: { 
        month: string; 
        achats: number; 
        ventes: number; 
        total: number;
        count: number;
    }[];
}