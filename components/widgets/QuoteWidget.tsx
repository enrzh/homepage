import React from 'react';
import { WidgetConfig } from '../../types';

interface QuoteWidgetProps {
  config: WidgetConfig;
}

const QuoteWidget: React.FC<QuoteWidgetProps> = ({ config }) => {
  const title = config.customTitle || 'Quote';
  const quoteText = config.quoteText || 'Consistency compounds. Keep shipping small wins every day.';
  const quoteAuthor = config.quoteAuthor || 'Nexus';

  return (
    <div className="h-full flex flex-col text-white p-4">
      <div className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-wider">
        {title}
      </div>
      <div className="mt-4 flex-1 flex flex-col justify-center">
        <p className="text-sm md:text-base text-white/85 italic leading-relaxed">“{quoteText}”</p>
        <div className="mt-3 text-xs text-white/50">— {quoteAuthor}</div>
      </div>
      <div className="text-[10px] text-white/40">Edit to personalize the quote</div>
    </div>
  );
};

export default QuoteWidget;
