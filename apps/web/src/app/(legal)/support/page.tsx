import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Soporte' };

export default function SupportPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>Soporte</h1>
      <p className="lead text-gray-500">
        ¿Necesitás ayuda con EDI? Estamos para asistirte.
      </p>

      <h2>Preguntas frecuentes</h2>

      <h3>¿EDI guarda el contenido de mis textos?</h3>
      <p>
        No. EDI nunca guarda el contenido de los textos que transformás. Si activás el historial,
        guardamos únicamente metadatos (fecha, tono usado, longitud aproximada) pero nunca el texto
        en sí.
      </p>

      <h3>¿Cómo se protegen mis claves de API?</h3>
      <p>
        Todas las claves se cifran con AES-256-GCM antes de almacenarse en la base de datos. La
        clave maestra de cifrado está separada de los datos. Solo se muestra una versión parcial
        enmascarada (ej: <code>sk-...abc123</code>).
      </p>

      <h3>¿Qué pasa si mi clave de API vence?</h3>
      <p>
        Recibirás recordatorios por correo 7 días y 1 día antes del vencimiento. Podés actualizar
        o rotar tu clave desde{' '}
        <Link href="/credentials">Claves de IA</Link>.
      </p>

      <h3>¿Puedo usar EDI sin conexión a internet?</h3>
      <p>
        Las transformaciones locales (mayúsculas, minúsculas, eliminar formato, Voseo CR básico)
        funcionan sin internet. Las transformaciones que usan IA requieren conexión.
      </p>

      <h3>¿Qué extensión necesita la extensión de Chrome?</h3>
      <p>
        La extensión de Chrome requiere acceso a todas las páginas web (<code>tabs</code> y{' '}
        <code>activeTab</code>) para detectar selecciones de texto. No accede a contraseñas ni datos
        sensibles.
      </p>

      <h3>¿Cómo elimino mi cuenta?</h3>
      <p>
        Podés iniciar el proceso desde{' '}
        <Link href="/account/delete">Cuenta → Eliminar cuenta</Link>. Tu cuenta se eliminará
        permanentemente después de un período de gracia de 30 días.
      </p>

      <h2>Contacto</h2>
      <p>
        Si tu pregunta no está respondida aquí, o si encontraste un problema de seguridad, podés
        contactarnos directamente:
      </p>
      <ul>
        <li>
          <strong>Soporte general:</strong>{' '}
          <a href="mailto:soporte@edi.app">soporte@edi.app</a>
        </li>
        <li>
          <strong>Reportes de seguridad:</strong>{' '}
          <a href="mailto:seguridad@edi.app">seguridad@edi.app</a>
        </li>
      </ul>

      <h2>Documentación</h2>
      <p>Para más información sobre el uso de la extensión, visitá nuestra documentación:</p>
      <ul>
        <li>
          <Link href="/privacy">Política de Privacidad</Link>
        </li>
        <li>
          <Link href="/terms">Términos de Servicio</Link>
        </li>
      </ul>
    </article>
  );
}
