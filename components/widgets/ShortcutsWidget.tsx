import React from 'react';
import { Plus, Globe } from 'lucide-react';
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
  // Regular: 3 cols (fits ~3 items/row), Wide: 6 cols
  const gridClass = isWide ? 'grid-cols-6' : 'grid-cols-3';
  // 2 rows max to fit height
  const maxItems = isWide ? 12 : 6;

  return (
    <div className="h-full flex flex-col p-4 text-white">
      <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
        {config.customTitle || 'Quick Links'}
      </h3>
      <div className={`grid ${gridClass} gap-2 h-full content-start`}>
        {displayLinks.slice(0, maxItems).map((sc) => (
          <a
            key={sc.id}
            href={sc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-square flex flex-col items-center justify-center gap-1.5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all hover:scale-105 hover:shadow-lg active:scale-95 group relative overflow-hidden"
            title={sc.title}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-8 h-8 rounded-full bg-white/10 p-1 flex items-center justify-center overflow-hidden shrink-0">
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
            <span className="text-[9px] text-white/60 group-hover:text-white font-medium truncate w-full text-center leading-tight">
                {sc.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ShortcutsWidget;