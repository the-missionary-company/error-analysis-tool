/** Screen Wake Lock helpers — keep mobile Safari/Chrome awake while dictating. */

export type WakeLockHandle = {
  release: () => Promise<void>;
};

export async function requestScreenWakeLock(): Promise<WakeLockHandle | null> {
  try {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void>; addEventListener: (type: string, fn: () => void) => void }> };
    };
    if (!nav.wakeLock?.request) return null;
    const lock = await nav.wakeLock.request('screen');
    return {
      release: async () => {
        try {
          await lock.release();
        } catch {
          // already released
        }
      },
    };
  } catch {
    return null;
  }
}
