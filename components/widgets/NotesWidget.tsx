import React from 'react';
import { WidgetConfig } from '../../types';

interface NotesWidgetProps {
  config: WidgetConfig;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ config }) => {
  const title = config.customTitle || 'Notes';
  const notes = config.notes && config.notes.length > 0
    ? config.notes
    : ['Capture quick ideas', 'Plan your next task', 'Remember the small wins'];

  return (
    <div className="h-full flex flex-col text-white p-4">
      <div className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-wider">
        {title}
      </div>
      <div className="mt-3 flex-1 space-y-2">
        {notes.slice(0, 4).map((note, index) => (
          <div key={`${note}-${index}`} className="flex items-start gap-2 text-sm text-white/80">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/40 flex-shrink-0" />
            <span className="line-clamp-2">{note}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-white/40">Double-click to edit notes</div>
    </div>
  );
};

export default NotesWidget;
