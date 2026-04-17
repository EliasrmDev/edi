import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Map API error codes to user-facing Spanish messages. */
export function errorMessage(code: string): string {
  const messages: Record<string, string> = {
    INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
    EMAIL_NOT_VERIFIED: 'Debés verificar tu correo antes de iniciar sesión.',
    RATE_LIMITED: 'Demasiados intentos. Intentá de nuevo en unos minutos.',
    EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con ese correo.',
    WEAK_PASSWORD: 'La contraseña no es lo suficientemente segura.',
    INVALID_TOKEN: 'El enlace no es válido.',
    TOKEN_EXPIRED: 'El enlace expiró. Solicitá uno nuevo.',
    UNAUTHORIZED: 'No estás autenticado.',
    FORBIDDEN: 'No tenés permiso para realizar esta acción.',
    NOT_FOUND: 'No se encontró el recurso solicitado.',
    INVALID_KEY_FORMAT: 'El formato de la clave no es válido para este proveedor.',
    CREDENTIAL_NOT_FOUND: 'No se encontró la credencial.',
    DELETION_ALREADY_REQUESTED: 'Ya existe una solicitud de eliminación pendiente.',
    SERVER_ERROR: 'Error del servidor. Por favor intentá más tarde.',
  };
  return messages[code] ?? 'Ocurrió un error inesperado.';
}
