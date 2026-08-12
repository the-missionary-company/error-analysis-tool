import { X } from 'lucide-react';
import { isMac } from '../lib/utils';

const rows = [
  ['1 / p', 'Mark Pass'],
  ['2 / f', 'Mark Fail'],
  ['⌘/Ctrl + S or ⌘/Ctrl + Enter', 'Save annotation'],
  ['← / j', 'Previous item'],
  ['→ / k', 'Next item'],
  ['n', 'Jump to next unlabeled'],
  ['?', 'Toggle this cheatsheet'],
];

export function HotkeyCheatsheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const mod = isMac() ? '⌘' : 'Ctrl';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Keyboard shortcuts"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Keyboard shortcuts</h2>
          <button type="button" className="btn-ghost px-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="space-y-2 text-sm">
          {rows.map(([keys, label]) => (
            <li key={label} className="flex items-center justify-between gap-4">
              <span className="text-ink-600">{label}</span>
              <span className="kbd whitespace-nowrap">
                {keys.replace('⌘/Ctrl', mod)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
