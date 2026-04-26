import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/user';
import { Button } from '@/components/ui/Button';
import { ChangePasswordSection } from './_ChangePasswordSection';

export default async function AccountPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Cuenta</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Gestioná la seguridad y privacidad de tu cuenta.
        </p>
      </div>

      <ChangePasswordSection hasPassword={currentUser.user.hasPassword} />

      {/* Danger zone */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Zona peligrosa</h2>
        </div>

        <div className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-slate-700 dark:border-slate-700">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Privacidad y exportación de datos</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Controlá qué datos guardamos y exportá tu información.
              </p>
            </div>
            <Link href="/account/privacy">
              <Button variant="secondary" className="shrink-0">Gestionar</Button>
            </Link>
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Eliminar cuenta</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Elimina todas tus claves de IA, perfil y datos de uso de forma permanente.
              </p>
            </div>
            <Link href="/account/delete">
              <Button variant="danger" className="shrink-0">Eliminar cuenta</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
