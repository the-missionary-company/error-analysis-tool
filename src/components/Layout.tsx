import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Keyboard, Layers3 } from 'lucide-react';
import { ToastViewport } from './Toast';
import { cn } from '../lib/utils';

export function Layout() {
  const { pathname } = useLocation();
  const onHub = pathname.startsWith('/datasets') || pathname.startsWith('/annotate') || pathname.startsWith('/taxonomy');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
              ED
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-ink-950">Eval dashboard</div>
              <div className="text-[11px] text-ink-500">Steers · Hub + A1</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-1.5 text-ink-600 hover:bg-ink-100',
                  isActive && 'bg-ink-100 font-medium text-ink-950',
                )
              }
            >
              Steers
            </NavLink>
            <NavLink
              to="/datasets"
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-1.5 text-ink-600 hover:bg-ink-100',
                  isActive && 'bg-ink-100 font-medium text-ink-950',
                )
              }
            >
              Hub + A1
            </NavLink>
            {onHub && (
              <span className="hidden items-center gap-1.5 px-2 text-ink-400 sm:flex" title="Keyboard-first">
                <Keyboard className="h-3.5 w-3.5" />
                <span className="text-xs">1/2 · j/k · ⌘S</span>
              </span>
            )}
            <a
              href="https://hamel.dev/"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost hidden text-xs sm:inline-flex"
              title="Hamel Husain error analysis"
            >
              <Layers3 className="h-3.5 w-3.5" />
              Method
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <Outlet />
      </main>
      <ToastViewport />
    </div>
  );
}
