import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Términos de Servicio' };

export default function TermsPage() {
  const lastUpdated = '1 de enero de 2025';

  return (
    <article className="prose prose-gray max-w-none">
      <h1>Términos de Servicio</h1>
      <p className="lead text-gray-500">
        Última actualización: {lastUpdated}
      </p>

      <h2>1. Aceptación</h2>
      <p>
        Al crear una cuenta en EDI aceptás estos Términos de Servicio y nuestra{' '}
        <Link href="/privacy">Política de Privacidad</Link>. Si no estás de acuerdo, no uses el
        servicio.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        EDI es una extensión de Chrome y plataforma web que permite transformar texto usando
        modelos de inteligencia artificial. El servicio requiere que aportes tus propias claves de
        API de proveedores de IA (modelo BYOK — Bring Your Own Key).
      </p>

      <h2>3. Elegibilidad</h2>
      <p>
        Podés usar EDI si tenés al menos 16 años de edad y residís en una jurisdicción donde el
        uso de servicios de IA está permitido. Sos responsable de verificar que el uso de modelos
        de IA esté permitido en tu país o región.
      </p>

      <h2>4. Tu cuenta</h2>
      <ul>
        <li>Sos responsable de mantener la confidencialidad de tu contraseña.</li>
        <li>Notificanos inmediatamente si creés que tu cuenta fue comprometida.</li>
        <li>No podés transferir tu cuenta a otra persona.</li>
        <li>Una persona, una cuenta.</li>
      </ul>

      <h2>5. Claves de API</h2>
      <p>
        Cuando cargás una clave de API de un proveedor de IA, declarás que:
      </p>
      <ul>
        <li>Tenés autorización para usar esa clave.</li>
        <li>Cumplís con los términos de uso del proveedor correspondiente.</li>
        <li>Sos responsable de los cargos que genere el uso de esa clave.</li>
      </ul>

      <h2>6. Uso aceptable</h2>
      <p>No podés usar EDI para:</p>
      <ul>
        <li>Generar, distribuir o almacenar contenido ilegal.</li>
        <li>Acosar, amenazar o dañar a otras personas.</li>
        <li>Eludir medidas de seguridad o controles de acceso.</li>
        <li>Automatizar el uso masivo que sobrecargue el servicio.</li>
        <li>Revender o sublicenciar el acceso al servicio.</li>
      </ul>

      <h2>7. Disponibilidad</h2>
      <p>
        Nos esforzamos por mantener EDI disponible, pero no garantizamos disponibilidad ininterrumpida.
        Podemos pausar el servicio temporalmente por mantenimiento o razones de seguridad.
      </p>

      <h2>8. Limitación de responsabilidad</h2>
      <p>
        EDI se provee &quot;tal como está&quot;. No somos responsables por los textos generados por
        modelos de IA, ni por pérdidas resultantes del uso del servicio o de interrupciones del mismo.
      </p>

      <h2>9. Cambios a estos términos</h2>
      <p>
        Podemos modificar estos términos. Te notificaremos por correo con al menos 14 días de
        anticipación ante cambios materiales.
      </p>

      <h2>10. Contacto</h2>
      <p>
        ¿Preguntas? Visitá nuestra <Link href="/support">página de soporte</Link>.
      </p>
    </article>
  );
}
