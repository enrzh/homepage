import React, { useEffect, useState } from 'react';
import { WidgetConfig } from '../../types';

interface QuoteWidgetProps {
  config: WidgetConfig;
}

const QuoteWidget: React.FC<QuoteWidgetProps> = ({ config }) => {
  const title = config.customTitle || 'Quote';
  const genre = config.quoteGenre || 'inspirational';
  const [quoteText, setQuoteText] = useState('Consistency compounds. Keep shipping small wins every day.');
  const [quoteAuthor, setQuoteAuthor] = useState('Nexus');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchQuote = async () => {
      setIsLoading(true);
      try {
        const tagParam = genre && genre !== 'any' ? `?tags=${encodeURIComponent(genre)}` : '';
        const response = await fetch(`https://api.quotable.io/random${tagParam}`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error('Quote fetch failed');
        const data = await response.json();
        if (isMounted) {
          setQuoteText(data.content);
          setQuoteAuthor(data.author || 'Unknown');
        }
      } catch (error) {
        if (isMounted) {
          setQuoteText('Consistency compounds. Keep shipping small wins every day.');
          setQuoteAuthor('Nexus');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchQuote();
    const refresh = setInterval(fetchQuote, 1000 * 60 * 60 * 6);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(refresh);
    };
  }, [genre]);

  return (
    <div className="h-full flex flex-col text-white p-4">
      <div className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-wider">
        {title}
      </div>
      <div className="mt-4 flex-1 flex flex-col justify-center">
        <p className="text-sm md:text-base text-white/85 italic leading-relaxed">“{quoteText}”</p>
        <div className="mt-3 text-xs text-white/50">— {quoteAuthor}</div>
      </div>
      <div className="text-[10px] text-white/40">
        {isLoading ? 'Fetching a fresh quote...' : `Auto-picked from ${genre.replace('-', ' ')} quotes`}
      </div>
    </div>
  );
};

export default QuoteWidget;
