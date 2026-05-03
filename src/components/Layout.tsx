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

  return (
    <div className="flex h-full">
      <aside className="w-[240px] shrink-0 border-r border-border flex flex-col">
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
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  active
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

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
