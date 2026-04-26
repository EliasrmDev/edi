'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input, type InputProps } from './Input';

type StrengthScore = 0 | 1 | 2 | 3 | 4;

function getPasswordStrength(password: string): { score: StrengthScore; label: string } {
  if (!password) return { score: 0, label: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const clamped = Math.min(4, score) as StrengthScore;
  const labels: Record<StrengthScore, string> = {
    0: '',
    1: 'Débil',
    2: 'Regular',
    3: 'Buena',
    4: 'Fuerte',
  };
  return { score: clamped, label: labels[clamped] };
}

const strengthColors: Record<StrengthScore, string> = {
  0: 'bg-gray-200',
  1: 'bg-red-500',
  2: 'bg-amber-500',
  3: 'bg-yellow-400',
  4: 'bg-green-500',
};

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showStrength?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showStrength = false, onChange, value, defaultValue, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const [password, setPassword] = React.useState(
      typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : '',
    );

    const strength = showStrength ? getPasswordStrength(password) : null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      onChange?.(e);
    };

    return (
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? 'text' : 'password'}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            className="pr-10"
            {...props}
          />
          <button
            type="button"
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400',
              'hover:text-gray-700 dark:hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-blue-500 rounded',
              // Adjust for the label that Input renders above; target the input height
              !showStrength ? 'top-[calc(50%+14px)]' : 'top-[calc(50%+24px)]',
            )}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {showStrength && password && strength && (
          <div className="mt-1" aria-live="polite">
            <div className="flex gap-1 mb-1" role="img" aria-label={`Fortaleza: ${strength.label}`}>
              {([1, 2, 3, 4] as const).map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    strength.score >= level ? strengthColors[strength.score] : 'bg-gray-200',
                  )}
                />
              ))}
            </div>
            {strength.label && (
              <p className="text-xs text-gray-600">
                Fortaleza: <span className="font-medium">{strength.label}</span>
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1={1} y1={1} x2={23} y2={23} />
    </svg>
  );
}
