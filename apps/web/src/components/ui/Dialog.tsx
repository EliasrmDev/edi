'use client';

import * as React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Button, type ButtonVariant } from './Button';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm?: () => void;
  loading?: boolean;
}

export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  onConfirm,
  loading = false,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}

      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        <RadixDialog.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-md',
            'translate-x-[-50%] translate-y-[-50%]',
            'rounded-xl bg-white p-6 shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'focus:outline-none',
          )}
        >
          <RadixDialog.Title className="text-base font-semibold text-gray-900">
            {title}
          </RadixDialog.Title>

          {description && (
            <RadixDialog.Description className="mt-1.5 text-sm text-gray-500">
              {description}
            </RadixDialog.Description>
          )}

          {children && <div className="mt-4">{children}</div>}

          {(onConfirm ?? confirmLabel) && (
            <div className="mt-6 flex justify-end gap-3">
              <RadixDialog.Close asChild>
                <Button variant="secondary" size="sm">
                  {cancelLabel}
                </Button>
              </RadixDialog.Close>
              <Button
                variant={confirmVariant}
                size="sm"
                loading={loading}
                onClick={onConfirm}
              >
                {confirmLabel ?? 'Confirmar'}
              </Button>
            </div>
          )}

          <RadixDialog.Close
            className="absolute right-4 top-4 rounded p-1 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Cerrar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
