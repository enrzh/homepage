import React, { useMemo } from 'react';
import { Globe, Settings } from 'lucide-react';
import { ShortcutLink, WidgetConfig } from '../../types';

interface ShortcutsWidgetProps {
  config: WidgetConfig;
  onEditRequest?: () => void;
}

const defaultShortcuts: ShortcutLink[] = [
  { id: '1', title: 'GitHub', url: 'https://github.com' },
  { id: '2', title: 'YouTube', url: 'https://youtube.com' },
  { id: '3', title: 'Gmail', url: 'https://mail.google.com' },
  { id: '4', title: 'Spotify', url: 'https://spotify.com' },
];

const ShortcutsWidget: React.FC<ShortcutsWidgetProps> = ({ config, onEditRequest }) => {
  const maxItems = 4;

  const displayLinks = useMemo(() => {
    const links = config.links;
    const baseLinks = links && links.length > 0 ? links : defaultShortcuts;
    return baseLinks.slice(0, maxItems).map(link => {
      let hostname = '';
      let favicon = '';
      try {
        const urlObj = new URL(link.url);
        hostname = urlObj.hostname.replace(/^www\./, '');
        favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
      } catch {
        // Fallback for invalid URLs
      }
      return { ...link, hostname, favicon };
    });
  }, [config.links, maxItems]);

  const title = config.customTitle || 'Quick Links';

  return (
    <div className="h-full flex flex-col p-4 text-white gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.2em]">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 font-medium">{displayLinks.length}</span>
          {onEditRequest && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditRequest();
              }}
              className="rounded-md border border-white/15 bg-white/10 p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Edit quick links widget"
              title="Edit quick links"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div
        className={`grid grid-cols-2 gap-2 md:gap-3 flex-1 items-stretch`}
      >
        {displayLinks.map((sc) => (
          <a
            key={sc.id}
            href={sc.url}
            className="group flex h-full items-center gap-3 rounded-md border border-white/5 bg-white/0 px-4 py-3 text-left transition-all hover:border-white/20 hover:bg-white/5 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 shadow-sm"
            title={sc.title}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-8 rounded-md bg-white/5 p-1.5 flex items-center justify-center overflow-hidden shrink-0 transition-transform group-hover:scale-110">
              <img
                src={sc.favicon}
                alt={sc.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Globe className="w-4 h-4 text-white/40 hidden" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white/90 truncate">
                {sc.title}
              </div>
              <div className="text-[10px] text-white/30 truncate">
                {sc.hostname}
              </div>
            </div>
            <span className="text-[10px] text-white/20 group-hover:text-white/50 transition-colors">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ShortcutsWidget);
