import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/actions/user';
import { ProfileForm } from './_ProfileForm';

export const metadata: Metadata = { title: 'Perfil' };

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-slate-100">Mi perfil</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <ProfileForm profile={currentUser?.profile ?? null} />
      </div>
    </div>
  );
}
