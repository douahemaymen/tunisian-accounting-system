import * as XLSX from 'xlsx';

interface EcritureForExport {
  date: string;
  journal: string;
  reference: string;
  libelle: string;
  num_compte: string;
  compte_libelle: string;
  debit: number;
  credit: number;
}

export function exportEcrituresToExcel(
  ecritures: EcritureForExport[],
  fileName: string = 'ecritures-comptables.xlsx'
) {
  // Préparer les données pour Excel
  const data = ecritures.map(e => ({
    'Date': new Date(e.date).toLocaleDateString('fr-FR'),
    'Journal': e.journal,
    'Référence': e.reference,
    'Libellé': e.libelle,
    'N° Compte': e.num_compte,
    'Compte': e.compte_libelle,
    'Débit': e.debit,
    'Crédit': e.credit
  }));

  // Ajouter une ligne de total
  const totalDebit = ecritures.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = ecritures.reduce((sum, e) => sum + e.credit, 0);

  data.push({
    'Date': '',
    'Journal': '',
    'Référence': '',
    'Libellé': 'TOTAL',
    'N° Compte': '',
    'Compte': '',
    'Débit': totalDebit,
    'Crédit': totalCredit
  });

  // Créer le workbook et la feuille
  const ws = XLSX.utils.json_to_sheet(data);

  // Définir la largeur des colonnes
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 15 }, // Journal
    { wch: 15 }, // Référence
    { wch: 40 }, // Libellé
    { wch: 12 }, // N° Compte
    { wch: 30 }, // Compte
    { wch: 15 }, // Débit
    { wch: 15 }  // Crédit
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Écritures');

  // Télécharger le fichier
  XLSX.writeFile(wb, fileName);
}

export function exportEcrituresByJournal(
  ecrituresByJournal: { [key: string]: EcritureForExport[] },
  fileName: string = 'ecritures-par-journal.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Créer une feuille par type de journal
  Object.entries(ecrituresByJournal).forEach(([journalType, ecritures]) => {
    if (ecritures.length === 0) return;

    const data = ecritures.map(e => ({
      'Date': new Date(e.date).toLocaleDateString('fr-FR'),
      'Référence': e.reference,
      'Libellé': e.libelle,
      'N° Compte': e.num_compte,
      'Compte': e.compte_libelle,
      'Débit': e.debit,
      'Crédit': e.credit
    }));

    // Ajouter une ligne de total
    const totalDebit = ecritures.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = ecritures.reduce((sum, e) => sum + e.credit, 0);

    data.push({
      'Date': '',
      'Référence': '',
      'Libellé': 'TOTAL',
      'N° Compte': '',
      'Compte': '',
      'Débit': totalDebit,
      'Crédit': totalCredit
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 12 },
      { wch: 15 },
      { wch: 40 },
      { wch: 12 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 }
    ];

    // Nom de la feuille (limité à 31 caractères)
    const sheetName = journalType.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // Télécharger le fichier
  XLSX.writeFile(wb, fileName);
}
