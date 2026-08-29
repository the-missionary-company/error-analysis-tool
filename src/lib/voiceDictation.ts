import { requestScreenWakeLock, type WakeLockHandle } from './wakeLock.js';

/** Hard cap so a pocketed phone cannot record forever. */
export const MAX_DICTATION_MS = 3 * 60 * 1000;

export type DictationPhase = 'idle' | 'recording' | 'uploading' | 'error';

export type DictationController = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => void;
  getPhase: () => DictationPhase;
  getElapsedMs: () => number;
};

export type DictationCallbacks = {
  onPhase?: (phase: DictationPhase) => void;
  onElapsed?: (ms: number) => void;
  onTranscript?: (text: string) => void;
  onError?: (message: string) => void;
  /** POST multipart audio; returns transcript text. */
  upload: (blob: Blob, filename: string) => Promise<string>;
};

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export function createDictationController(callbacks: DictationCallbacks): DictationController {
  let phase: DictationPhase = 'idle';
  let mediaStream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let wake: WakeLockHandle | null = null;
  let startedAt = 0;
  let tickTimer: ReturnType<typeof setInterval> | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;
  let mimeType = '';

  const setPhase = (next: DictationPhase) => {
    phase = next;
    callbacks.onPhase?.(next);
  };

  const clearTimers = () => {
    if (tickTimer) clearInterval(tickTimer);
    if (maxTimer) clearTimeout(maxTimer);
    tickTimer = null;
    maxTimer = null;
  };

  const stopTracks = () => {
    mediaStream?.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  };

  const releaseWake = async () => {
    const handle = wake;
    wake = null;
    await handle?.release();
  };

  const cancel = () => {
    clearTimers();
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    } catch {
      // ignore
    }
    recorder = null;
    chunks = [];
    stopTracks();
    void releaseWake();
    setPhase('idle');
  };

  const finishUpload = async (blob: Blob) => {
    setPhase('uploading');
    try {
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const text = await callbacks.upload(blob, `dictation.${ext}`);
      const trimmed = text.trim();
      if (trimmed) callbacks.onTranscript?.(trimmed);
      setPhase('idle');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transcription failed';
      callbacks.onError?.(message);
      setPhase('error');
    } finally {
      await releaseWake();
      stopTracks();
      clearTimers();
      recorder = null;
      chunks = [];
    }
  };

  const stop = async () => {
    if (!recorder || phase !== 'recording') return;
    clearTimers();
    await new Promise<void>((resolve) => {
      const rec = recorder;
      if (!rec) {
        resolve();
        return;
      }
      rec.onstop = () => resolve();
      try {
        if (rec.state !== 'inactive') rec.stop();
        else resolve();
      } catch {
        resolve();
      }
    });
    const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
    chunks = [];
    if (blob.size < 64) {
      callbacks.onError?.('No audio captured');
      setPhase('error');
      await releaseWake();
      stopTracks();
      return;
    }
    await finishUpload(blob);
  };

  const start = async () => {
    if (phase === 'recording' || phase === 'uploading') return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      callbacks.onError?.('Microphone not available in this browser');
      setPhase('error');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      callbacks.onError?.('Recording not supported in this browser');
      setPhase('error');
      return;
    }

    mimeType = pickMimeType();
    chunks = [];
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
    } catch {
      callbacks.onError?.('Microphone permission denied');
      setPhase('error');
      return;
    }

    wake = await requestScreenWakeLock();
    try {
      recorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream);
      mimeType = recorder.mimeType || mimeType || 'audio/webm';
    } catch {
      stopTracks();
      await releaseWake();
      callbacks.onError?.('Could not start recorder');
      setPhase('error');
      return;
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.start(1000);
    startedAt = Date.now();
    setPhase('recording');
    callbacks.onElapsed?.(0);
    tickTimer = setInterval(() => {
      callbacks.onElapsed?.(Date.now() - startedAt);
    }, 250);
    maxTimer = setTimeout(() => {
      void stop();
    }, MAX_DICTATION_MS);
  };

  return {
    start,
    stop,
    cancel,
    getPhase: () => phase,
    getElapsedMs: () => (phase === 'recording' ? Date.now() - startedAt : 0),
  };
}

export function appendTranscript(current: string, addition: string): string {
  const next = addition.trim();
  if (!next) return current;
  const base = current.trimEnd();
  if (!base) return next;
  const needsSpace = !/\s$/.test(base) && !/^[.,!?;:]/.test(next);
  return `${base}${needsSpace ? ' ' : ''}${next}`;
}
