// Utilitaires centralisés pour les réponses HTTP
import { NextResponse } from 'next/server';

/**
 * Remplace les BigInt par des strings pour la sérialisation JSON
 */
export function bigIntReplacer(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

/**
 * Crée une réponse JSON avec gestion automatique des BigInt
 */
export function jsonResponse(data: any, status: number = 200): NextResponse {
  const serializedBody = JSON.stringify(data, bigIntReplacer);
  
  return new NextResponse(serializedBody, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Crée une réponse d'erreur standardisée
 */
export function errorResponse(message: string, status: number = 500, details?: any): NextResponse {
  return jsonResponse(
    { 
      error: message,
      ...(details && { details })
    },
    status
  );
}

/**
 * Crée une réponse de succès standardisée
 */
export function successResponse(data: any, message?: string, status: number = 200): NextResponse {
  return jsonResponse(
    {
      success: true,
      ...(message && { message }),
      ...data
    },
    status
  );
}
