import type { Metadata } from 'next';
import { getUsageStats } from '@/lib/actions/transform';
import { UsageDashboard } from './_UsageDashboard';

export const metadata: Metadata = { title: 'Estadísticas de uso' };

export default async function UsagePage() {
  const stats = await getUsageStats();
  // Computed server-side so client and server render the chart with the same anchor date,
  // preventing hydration mismatches near UTC midnight boundaries.
  const serverDateStr = new Date().toISOString().slice(0, 10);
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
          Estadísticas de uso
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Consumo de cuota de IA y actividad de transformaciones.
        </p>
      </div>
      <UsageDashboard stats={stats} serverDateStr={serverDateStr} />
    </div>
  );
}
