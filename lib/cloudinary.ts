// lib/cloudinary.ts
const CLOUD_NAME = 'dia9cnjhz';
const UNSIGNED_PRESET = (typeof window !== 'undefined' ? (window as any).CLOUDINARY_UNSIGNED_PRESET : undefined) || 'unsigned_comptascan';

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
}

/**
 * Corrige une URL Cloudinary pour un PDF qui serait dans /image/upload/ au lieu de /raw/upload/
 * Cette fonction permet de corriger les URLs existantes qui pointent vers le mauvais endpoint
 */
export function fixCloudinaryPdfUrl(url: string): string {
  if (!url) return url;
  
  // Si c'est une URL Cloudinary avec .pdf mais dans /image/upload/, corriger
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('cloudinary.com') && 
      lowerUrl.includes('.pdf') && 
      lowerUrl.includes('/image/upload/')) {
    return url.replace('/image/upload/', '/raw/upload/');
  }
  
  return url;
}

/**
 * Upload un fichier (image ou PDF) vers Cloudinary
 * Cloudinary supporte automatiquement les images et les PDF
 */
export async function uploadImageToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME) throw new Error('Cloudinary cloud name manquant.');
  if (!UNSIGNED_PRESET) throw new Error('Preset manquant.');

  // Vérifier que le fichier est une image ou un PDF
  const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
  if (!isValidType) {
    throw new Error('Format de fichier non supporté. Veuillez utiliser une image (JPG, PNG, etc.) ou un PDF.');
  }

  // Pour les PDF, utiliser 'raw' pour un stockage correct et un accès direct
  // Pour les images, utiliser 'auto' qui détecte automatiquement
  const isPdf = file.type === 'application/pdf';
  const resourceType = isPdf ? 'raw' : 'auto';
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UNSIGNED_PRESET);
  
  // Note: Le resource_type est déjà spécifié dans l'URL de l'endpoint
  // Les presets unsigned ont des restrictions sur les paramètres qu'on peut envoyer
  // Ne pas ajouter resource_type ou access_mode ici, ils doivent être configurés dans le preset Cloudinary

  const response = await fetch(endpoint, { method: 'POST', body: formData });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Échec Cloudinary: ${errorText}`);
  }
  
  const result = await response.json() as CloudinaryUploadResult;
  
  // Pour les PDF, s'assurer que l'URL pointe vers le bon endpoint raw
  if (isPdf && result.secure_url) {
    // Si l'URL contient '/image/upload/', la remplacer par '/raw/upload/'
    result.secure_url = result.secure_url.replace('/image/upload/', '/raw/upload/');
    if (result.url) {
      result.url = result.url.replace('/image/upload/', '/raw/upload/');
    }
  }
  
  return result;
}
