import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, Bot, Sparkles } from 'lucide-react';

interface SearchBarProps {
  enablePreview: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ enablePreview }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced suggestion fetch
  useEffect(() => {
    if (!enablePreview || !query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Using DuckDuckGo AC API via proxy as it's public and easy to parse
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://duckduckgo.com/ac/?q=${query}&type=list`)}`;
        const res = await fetch(proxyUrl);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            // DDG returns [phrase, phrase...]
            setSuggestions(data[1] || []); 
        }
      } catch (e) {
        // Silent fail for suggestions
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, enablePreview]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (engine: 'google' | 'perplexity' | 'google_ai', searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    const encodedQuery = encodeURIComponent(searchQuery);
    let url = '';

    switch (engine) {
      case 'google':
        url = `https://www.google.com/search?q=${encodedQuery}`;
        break;
      case 'perplexity':
        url = `https://www.perplexity.ai/search?q=${encodedQuery}`;
        break;
      case 'google_ai':
        url = `https://g.ai/?q=${encodedQuery}`; 
        break;
    }

    if (url) {
      window.location.href = url;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch('google');
    }
  };

  const hasSuggestions = enablePreview && isFocused && suggestions.length > 0;

  return (
    <div ref={containerRef} className="w-full max-w-2xl relative z-30">
      <div className="relative group">
        <div className={`
          absolute inset-0 bg-gradient-to-r from-slate-500/20 via-slate-600/20 to-slate-700/20 rounded-3xl blur-2xl transition-opacity duration-500
          ${isFocused ? 'opacity-100' : 'opacity-0'}
        `} />
        
        {/* Input Container */}
        <div className={`
          relative flex items-center bg-slate-950/70 backdrop-blur-2xl border border-white/10 transition-all duration-300 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.9)]
          
          /* Default (Mobile/Bottom) Shape */
          rounded-3xl
          
          /* Desktop when focused: flatten bottom corner to attach to suggestions */
          ${isFocused ? 'md:border-white/30 md:shadow-[0_28px_60px_-35px_rgba(0,0,0,0.9)]' : 'hover:border-white/20'}
          ${hasSuggestions ? 'md:rounded-b-none md:shadow-none' : ''}
        `}>
          <Search className={`w-5 h-5 ml-4 transition-colors ${isFocused ? 'text-white' : 'text-white/40'}`} />
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-full bg-transparent border-none outline-none text-white px-4 py-3.5 md:py-4 text-base md:text-lg placeholder-white/30"
          />

          <div className="flex items-center gap-1 pr-2">
            <button
              onClick={() => handleSearch('perplexity')}
              title="Perplexity"
              className="p-2 md:p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors active:bg-white/5"
            >
              <Bot className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSearch('google')}
              title="Google"
              className="p-2 md:p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors active:bg-white/5"
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSearch('google_ai')}
              title="Google AI"
              className="p-2 md:p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors active:bg-white/5"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {hasSuggestions && (
            <div className={`
                absolute left-0 right-0 bg-slate-950/90 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl
                
                /* Mobile: Pop UP (bottom-full) with gap */
                bottom-full mb-2 rounded-2xl
                
                /* Desktop: Pop DOWN (top-full) attached */
                md:bottom-auto md:top-full md:mb-0 md:rounded-t-none md:rounded-b-3xl md:border-t-0
            `}>
                {suggestions.slice(0, 5).map((item, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setQuery(item);
                            handleSearch('google', item);
                        }}
                        className="w-full text-left px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3 text-sm md:text-base active:bg-white/20"
                    >
                        <Search className="w-4 h-4 text-white/30" />
                        {item}
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
