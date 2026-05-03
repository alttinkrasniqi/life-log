import { Link, useLocation } from 'react-router-dom';
import { Calendar, BarChart3, Layers, Settings as Cog } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fmtDate } from '@/lib/date';
import { useStore } from '@/store/useStore';

const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: Calendar },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/categories', label: 'Categories', icon: Layers },
  { to: '/settings', label: 'Settings', icon: Cog },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const entryCount = Object.keys(useStore((s) => s.entries)).length;

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <Link to="/" className="block">
          <div className="font-serif text-[20px] leading-none italic tracking-tight">
            Life
            <span className="text-accent not-italic font-sans font-medium ml-1">·</span>
            <span className="font-sans not-italic font-medium tracking-tight ml-1">log</span>
          </div>
        </Link>
        <div className="text-[10px] uppercase tracking-[0.2em] text-text-3">
          {entryCount.toLocaleString()} entries
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] shrink-0 border-r border-border flex-col">
        <div className="px-6 py-6">
          <Link to="/" className="block">
            <div className="font-serif text-[22px] leading-none italic tracking-tight">
              Life<span className="text-accent not-italic font-sans font-medium ml-1">·</span>
              <span className="font-sans not-italic font-medium tracking-tight ml-1">log</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-text-3 mt-2">
              Personal analytics
            </div>
          </Link>
        </div>

        <nav className="px-3 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive(item.to)
                    ? 'bg-surface-2 text-text'
                    : 'text-text-2 hover:text-text hover:bg-surface',
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-5 border-t border-border">
          <div className="text-[10px] uppercase tracking-[0.2em] text-text-3 mb-1">
            Total entries
          </div>
          <div className="font-serif text-2xl">{entryCount.toLocaleString()}</div>
          <div className="text-xs text-text-3 mt-3">{fmtDate(new Date(), 'MMMM yyyy')}</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pb-[76px] md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-bg/95 backdrop-blur-md"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-3 transition-colors',
                  active ? 'text-text' : 'text-text-3',
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5} />
                <span className="text-[10px] tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
