import React from 'react';
import { X, Type, Search, Eye, EyeOff } from 'lucide-react';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showTitle: boolean;
  setShowTitle: (show: boolean) => void;
  enableSearchPreview: boolean;
  setEnableSearchPreview: (enable: boolean) => void;
}

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({
  isOpen,
  onClose,
  showTitle,
  setShowTitle,
  enableSearchPreview,
  setEnableSearchPreview,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-semibold text-white">Dashboard Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
            {/* Title Setting */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                        <Type className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white">Dashboard Title</h3>
                        <p className="text-xs text-white/40">Show the main title on home screen</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowTitle(!showTitle)}
                    className={`
                        relative w-12 h-6 rounded-full transition-colors duration-200
                        ${showTitle ? 'bg-purple-500' : 'bg-white/10'}
                    `}
                >
                    <div className={`
                        absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
                        ${showTitle ? 'translate-x-6' : 'translate-x-0'}
                    `} />
                </button>
            </div>

            {/* Search Preview Setting */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        <Search className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white">Search Previews</h3>
                        <p className="text-xs text-white/40">Show suggestions while typing</p>
                    </div>
                </div>
                <button 
                    onClick={() => setEnableSearchPreview(!enableSearchPreview)}
                    className={`
                        relative w-12 h-6 rounded-full transition-colors duration-200
                        ${enableSearchPreview ? 'bg-blue-500' : 'bg-white/10'}
                    `}
                >
                    <div className={`
                        absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200
                        ${enableSearchPreview ? 'translate-x-6' : 'translate-x-0'}
                    `} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsModal;
