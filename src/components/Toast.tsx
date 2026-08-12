import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { cn } from '../lib/utils';

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(100vw-2rem,360px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-3.5 py-3 shadow-soft',
            t.kind === 'success' && 'border-emerald-200',
            t.kind === 'error' && 'border-red-200',
            t.kind === 'info' && 'border-ink-200',
          )}
        >
          {t.kind === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 text-pass" />}
          {t.kind === 'error' && <XCircle className="mt-0.5 h-4 w-4 text-fail" />}
          {t.kind === 'info' && <Info className="mt-0.5 h-4 w-4 text-accent" />}
          <p className="flex-1 text-sm text-ink-800">{t.message}</p>
          <button
            type="button"
            className="rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
