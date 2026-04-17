import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Política de Privacidad' };

export default function PrivacyPage() {
  const lastUpdated = '1 de enero de 2025';

  return (
    <article className="prose prose-gray max-w-none">
      <h1>Política de Privacidad</h1>
      <p className="lead text-gray-500">
        Última actualización: {lastUpdated}
      </p>

      <h2>1. Datos que recopilamos</h2>
      <p>
        EDI recopila únicamente los datos necesarios para prestarte el servicio:
      </p>
      <ul>
        <li>
          <strong>Datos de cuenta:</strong> dirección de correo electrónico utilizada para registrarte.
        </li>
        <li>
          <strong>Claves de API:</strong> las claves de proveedores de IA que cargás se almacenan
          cifradas con AES-256-GCM. Nunca accedemos a su contenido completo.
        </li>
        <li>
          <strong>Registros de uso:</strong> si activás el historial, guardamos metadatos de las
          transformaciones realizadas (fecha, tono, longitud aproximada). Nunca el contenido del texto.
        </li>
        <li>
          <strong>Datos de sesión:</strong> un token de sesión seguro almacenado en una cookie
          HttpOnly para mantener tu sesión activa.
        </li>
      </ul>

      <h2>2. Cómo usamos tus datos</h2>
      <p>Usamos tus datos exclusivamente para:</p>
      <ul>
        <li>Brindarte el servicio de transformación de texto.</li>
        <li>Enviarte notificaciones sobre el vencimiento de tus claves de API.</li>
        <li>Mostrarte estadísticas de uso de tu propia cuenta.</li>
        <li>Cumplir con obligaciones legales.</li>
      </ul>
      <p>
        <strong>No vendemos, alquilamos ni compartimos tus datos con terceros</strong> para fines
        publicitarios ni comerciales.
      </p>

      <h2>3. Cifrado y seguridad</h2>
      <p>
        Todas las claves de API se cifran con AES-256-GCM antes de almacenarse. La clave maestra de
        cifrado está separada de la base de datos. Las contraseñas se hashean con bcrypt. Las
        comunicaciones se protegen con TLS.
      </p>

      <h2>4. Tus derechos</h2>
      <p>Tenés derecho a:</p>
      <ul>
        <li>Acceder a todos tus datos desde el panel de control.</li>
        <li>Exportar tus datos en cualquier momento desde{' '}
          <Link href="/account/privacy">Configuración → Privacidad</Link>.
        </li>
        <li>Eliminar tu cuenta y todos tus datos desde{' '}
          <Link href="/account/delete">Configuración → Eliminar cuenta</Link>.
        </li>
        <li>Corregir tu información de perfil desde{' '}
          <Link href="/profile">tu perfil</Link>.
        </li>
      </ul>

      <h2>5. Retención de datos</h2>
      <p>
        Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta, todos tus
        datos se borran permanentemente en un plazo de 30 días. Los registros de auditoría de
        seguridad se retienen por 90 días adicionales por requisitos legales.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Usamos una única cookie de sesión (<code>session</code>) estrictamente necesaria para
        autenticarte. Es una cookie HttpOnly, Secure y SameSite=Strict. No usamos cookies de
        seguimiento ni publicidad.
      </p>

      <h2>7. Contacto</h2>
      <p>
        Si tenés preguntas sobre esta política, visitá nuestra{' '}
        <Link href="/support">página de soporte</Link>.
      </p>
    </article>
  );
}
