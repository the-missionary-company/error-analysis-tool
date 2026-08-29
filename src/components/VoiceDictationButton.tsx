import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import {
  MAX_DICTATION_MS,
  appendTranscript,
  createDictationController,
  type DictationPhase,
} from '../lib/voiceDictation';
import { cn } from '../lib/utils';

async function uploadDictation(blob: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append('file', blob, filename);
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: form,
    credentials: 'same-origin',
  });
  const body = (await response.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!response.ok) {
    throw new Error(body.error || `Transcription failed (${response.status})`);
  }
  return typeof body.text === 'string' ? body.text : '';
}

function formatElapsed(ms: number): string {
  const total = Math.min(MAX_DICTATION_MS, Math.max(0, ms));
  const sec = Math.floor(total / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoiceDictationButton({
  value,
  onChange,
  className,
  compact = false,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  compact?: boolean;
}) {
  const [phase, setPhase] = useState<DictationPhase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<ReturnType<typeof createDictationController> | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  onChangeRef.current = onChange;

  useEffect(() => {
    const controller = createDictationController({
      upload: uploadDictation,
      onPhase: setPhase,
      onElapsed: setElapsed,
      onTranscript: (text) => onChangeRef.current(appendTranscript(valueRef.current, text)),
      onError: (message) => setError(message),
    });
    controllerRef.current = controller;
    return () => controller.cancel();
  }, []);

  const busy = phase === 'recording' || phase === 'uploading';
  const label =
    phase === 'recording'
      ? `Stop ${formatElapsed(elapsed)}`
      : phase === 'uploading'
        ? 'Transcribing…'
        : compact
          ? 'Voice'
          : 'Dictate';

  return (
    <div className={cn('inline-flex flex-col items-stretch gap-1', className)}>
      <button
        type="button"
        className={cn(
          'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium ring-1 transition',
          phase === 'recording'
            ? 'bg-rose-600 text-white ring-rose-700'
            : phase === 'uploading'
              ? 'bg-ink-100 text-ink-500 ring-ink-200'
              : 'bg-surface text-ink-700 ring-ink-200 hover:bg-ink-50',
          compact && 'h-8 px-2',
        )}
        disabled={phase === 'uploading'}
        aria-pressed={phase === 'recording'}
        aria-label={
          phase === 'recording'
            ? `Stop dictation, ${formatElapsed(elapsed)} of 3:00`
            : 'Start voice dictation with Grok (up to 3 minutes)'
        }
        onClick={() => {
          setError(null);
          const controller = controllerRef.current;
          if (!controller) return;
          if (phase === 'recording') void controller.stop();
          else void controller.start();
        }}
      >
        {phase === 'uploading' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : phase === 'recording' ? (
          <Square className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
      {busy && (
        <p className="text-[10px] leading-tight text-ink-400">
          {phase === 'recording'
            ? 'Screen stays awake · max 3:00 · tap Stop when done'
            : 'Sending to Grok…'}
        </p>
      )}
      {error && !busy && <p className="text-[10px] leading-tight text-rose-700">{error}</p>}
    </div>
  );
}
