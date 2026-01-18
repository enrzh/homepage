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

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
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
          {config.customTitle || 'Quick Links'}
        </h3>
        <span className="text-[10px] text-white/40 font-medium">
          {visibleCount} link{visibleCount === 1 ? '' : 's'}
        </span>
      </div>
      <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-2">
        <div className={`grid ${gridClass} gap-3 h-full content-start auto-rows-fr`}>
          {displayLinks.slice(0, maxItems).map((sc) => (
            <a
              key={sc.id}
              href={sc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square flex flex-col items-center justify-center gap-2 p-2 rounded-2xl bg-white/10 hover:bg-white/20 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              title={sc.title}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-2xl bg-white/15 p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                <img 
                  src={getFavicon(sc.url)} 
                  alt={sc.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <Globe className="w-4 h-4 text-white/50 hidden" />
              </div>
              {/* Label */}
              <span className="text-[10px] text-white/70 group-hover:text-white font-semibold truncate w-full text-center leading-tight">
                {sc.title}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShortcutsWidget;
