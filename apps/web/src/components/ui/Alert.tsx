import * as React from 'react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'error' | 'warning' | 'success' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  error:   'bg-red-50   border-red-200   text-red-800   dark:bg-red-950/60   dark:border-red-800/50   dark:text-red-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800/50 dark:text-amber-300',
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/60 dark:border-green-800/50 dark:text-green-300',
  info:    'bg-blue-50  border-blue-200  text-blue-800  dark:bg-blue-950/60  dark:border-blue-800/50  dark:text-blue-300',
};

const iconMap: Record<AlertVariant, React.ReactNode> = {
  error: (
    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export function Alert({
  variant = 'info',
  title,
  className,
  children,
  role,
  ...props
}: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : (role ?? 'status')}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border p-3 text-sm',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {iconMap[variant]}
      <div className="flex-1">
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
