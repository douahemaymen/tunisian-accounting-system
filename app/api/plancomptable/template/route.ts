import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// GET - Télécharger un template Excel pour l'import
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Données d'exemple pour le template
    const templateData = [
      { num_compte: '1010000', libelle: 'Capital social', type_compte: 'Capitaux propres' },
      { num_compte: '2110000', libelle: 'Terrains', type_compte: 'Actif' },
      { num_compte: '2130000', libelle: 'Constructions', type_compte: 'Actif' },
      { num_compte: '2180000', libelle: 'Installations techniques', type_compte: 'Actif' },
      { num_compte: '2400000', libelle: 'Matériel et outillage', type_compte: 'Actif' },
      { num_compte: '2830000', libelle: 'Matériel de transport', type_compte: 'Actif' },
      { num_compte: '2840000', libelle: 'Matériel et mobilier de bureau', type_compte: 'Actif' },
      { num_compte: '3100000', libelle: 'Matières premières', type_compte: 'Actif' },
      { num_compte: '3200000', libelle: 'Autres approvisionnements', type_compte: 'Actif' },
      { num_compte: '3500000', libelle: 'Produits finis', type_compte: 'Actif' },
      { num_compte: '4110000', libelle: 'Clients', type_compte: 'Actif' },
      { num_compte: '4010000', libelle: 'Fournisseurs', type_compte: 'Passif' },
      { num_compte: '4210000', libelle: 'Personnel - Rémunérations dues', type_compte: 'Passif' },
      { num_compte: '4300000', libelle: 'Sécurité sociale et autres organismes', type_compte: 'Passif' },
      { num_compte: '4450000', libelle: 'État - TVA facturée', type_compte: 'Passif' },
      { num_compte: '4455000', libelle: 'État - TVA récupérable', type_compte: 'Actif' },
      { num_compte: '4500000', libelle: 'État - Impôts et taxes', type_compte: 'Passif' },
      { num_compte: '5120000', libelle: 'Banque', type_compte: 'Actif' },
      { num_compte: '5300000', libelle: 'Caisse', type_compte: 'Actif' },
      { num_compte: '6010000', libelle: 'Achats de matières premières', type_compte: 'Charge' },
      { num_compte: '6020000', libelle: 'Achats d\'approvisionnements', type_compte: 'Charge' },
      { num_compte: '6110000', libelle: 'Sous-traitance générale', type_compte: 'Charge' },
      { num_compte: '6210000', libelle: 'Personnel - Salaires', type_compte: 'Charge' },
      { num_compte: '6220000', libelle: 'Personnel - Charges sociales', type_compte: 'Charge' },
      { num_compte: '6250000', libelle: 'Personnel - Autres charges', type_compte: 'Charge' },
      { num_compte: '6310000', libelle: 'Impôts et taxes', type_compte: 'Charge' },
      { num_compte: '6400000', libelle: 'Charges de personnel extérieur', type_compte: 'Charge' },
      { num_compte: '6500000', libelle: 'Autres charges externes', type_compte: 'Charge' },
      { num_compte: '6600000', libelle: 'Charges financières', type_compte: 'Charge' },
      { num_compte: '7010000', libelle: 'Ventes de produits finis', type_compte: 'Produit' },
      { num_compte: '7060000', libelle: 'Prestations de services', type_compte: 'Produit' },
      { num_compte: '7500000', libelle: 'Autres produits de gestion courante', type_compte: 'Produit' },
      { num_compte: '7600000', libelle: 'Produits financiers', type_compte: 'Produit' }
    ];

    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new();
    
    // Créer une feuille de calcul avec les données
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plan Comptable');
    
    // Générer le buffer Excel
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer' 
    });

    // Retourner le fichier Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-plan-comptable.xlsx"'
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération du template:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du template' },
      { status: 500 }
    );
  }
}