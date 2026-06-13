'use client';

import React from 'react';
import { Button } from './ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md scale-100 overflow-hidden border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_#000000] transition-all duration-300 dark:border-white dark:bg-zinc-950 dark:shadow-[6px_6px_0px_0px_#ffffff]">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 items-center justify-center border border-black bg-red-50 text-red-600 dark:border-white dark:bg-red-950/20 dark:text-red-400">
            <AlertTriangle className="size-5" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-55 tracking-tight uppercase">
            {title}
          </h3>
        </div>

        <p className="mt-3.5 text-xs font-semibold leading-relaxed text-slate-500 dark:text-zinc-400">
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="text-xs px-4 py-2"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <Trash2 className="size-3.5" />
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
