import React from 'react';
import { Globe } from 'lucide-react';
import { ShortcutLink, WidgetConfig } from '../../types';

interface ShortcutsWidgetProps {
  config: WidgetConfig;
}

const defaultShortcuts: ShortcutLink[] = [
  { id: '1', title: 'GitHub', url: 'https://github.com' },
  { id: '2', title: 'YouTube', url: 'https://youtube.com' },
  { id: '3', title: 'Gmail', url: 'https://mail.google.com' },
  { id: '4', title: 'Spotify', url: 'https://spotify.com' },
];

const ShortcutsWidget: React.FC<ShortcutsWidgetProps> = ({ config }) => {
  const links = config.links;
  const displayLinks = links && links.length > 0 ? links : defaultShortcuts;
  const title = config.customTitle || 'Quick Links';

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };

  const isWide = config.colSpan === 2;
  const gridClass = isWide ? 'grid-cols-4' : 'grid-cols-2';
  const maxItems = isWide ? 8 : 4;
  const visibleCount = Math.min(displayLinks.length, maxItems);

  return (
    <div className="h-full flex flex-col p-4 text-white gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-[10px] text-white/40 font-medium">
          {visibleCount} link{visibleCount === 1 ? '' : 's'}
        </span>
      </div>
      <div className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-white/5 p-2">
        <div className={`grid ${gridClass} gap-2 md:gap-3 h-full content-start auto-rows-[minmax(0,1fr)]`}>
          {displayLinks.slice(0, maxItems).map((sc) => (
            <a
              key={sc.id}
              href={sc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-2 transition-colors hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              title={sc.title}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white/10 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  <img
                    src={getFavicon(sc.url)}
                    alt={sc.title}
                    className="w-4 h-4 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <Globe className="w-4 h-4 text-white/50 hidden" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-white/90 truncate">
                    {sc.title}
                  </div>
                  <div className="text-[10px] text-white/40 truncate">
                    {getHostname(sc.url)}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShortcutsWidget;
