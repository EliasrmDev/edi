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
    INVALID_API_KEY: 'La clave API no es válida o fue revocada. Verificá que sea correcta.',
    CREDENTIAL_NOT_FOUND: 'No se encontró la credencial.',
    DELETION_ALREADY_REQUESTED: 'Ya existe una solicitud de eliminación pendiente.',
    DISPLAY_NAME_TOO_LONG: 'El nombre es demasiado largo (máx. 100 caracteres).',
    INVALID_PASSWORD: 'La contraseña actual es incorrecta.',
    PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 12 caracteres.',
    PASSWORD_TOO_LONG: 'La contraseña es demasiado larga (máx. 128 caracteres).',
    PASSWORD_TOO_COMMON: 'La contraseña es demasiado común. Elegí una más segura.',
    PASSWORD_CONTAINS_EMAIL: 'La contraseña no puede contener tu correo electrónico.',
    VALIDATION_ERROR: 'Los datos ingresados no son válidos.',
    INTERNAL_SERVER_ERROR: 'Error interno del servidor. Por favor intentá más tarde.',
    SERVER_ERROR: 'Error del servidor. Por favor intentá más tarde.',
  };
  return messages[code] ?? 'Ocurrió un error inesperado.';
}
