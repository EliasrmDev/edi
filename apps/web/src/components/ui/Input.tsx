'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, description, id: idProp, ...props }, ref) => {
    const generatedId = React.useId();
    const id = idProp ?? generatedId;
    const descriptionId = description ? `${id}-desc` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
          {props.required && (
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>

        {description && (
          <p id={descriptionId} className="text-xs text-gray-500 dark:text-slate-400">
            {description}
          </p>
        )}

        <input
          ref={ref}
          id={id}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900',
            'placeholder:text-gray-400',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            'dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500',
            'dark:disabled:bg-slate-900 dark:disabled:text-slate-600',
            'dark:focus:ring-blue-400 dark:focus:border-blue-400',
            error
              ? 'border-red-400 focus:ring-red-400 focus:border-red-400 dark:border-red-600 dark:focus:ring-red-500'
              : 'border-gray-300 dark:border-slate-600',
            className,
          )}
          {...props}
        />

        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
