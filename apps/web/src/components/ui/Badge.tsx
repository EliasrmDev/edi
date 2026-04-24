import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800/50',
  warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50',
  error:   'bg-red-100   text-red-800   border-red-200   dark:bg-red-950/60   dark:text-red-300   dark:border-red-800/50',
  info:    'bg-blue-100  text-blue-800  border-blue-200  dark:bg-blue-950/60  dark:text-blue-300  dark:border-blue-800/50',
  neutral: 'bg-gray-100  text-gray-700  border-gray-200  dark:bg-slate-800    dark:text-slate-300  dark:border-slate-600',
};

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
