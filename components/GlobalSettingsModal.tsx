import React from 'react';
import { X, Type, Search, Cloud, CloudOff, RefreshCw, Lock } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showTitle: boolean;
  setShowTitle: (show: boolean) => void;
  enableSearchPreview: boolean;
  setEnableSearchPreview: (enable: boolean) => void;
  lockWidgets: boolean;
  setLockWidgets: (locked: boolean) => void;
  canSync: boolean;
  serverError: boolean;
  isRetrying: boolean;
  onRetrySync: () => void;
}

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({
  isOpen,
  onClose,
  showTitle,
  setShowTitle,
  enableSearchPreview,
  setEnableSearchPreview,
  lockWidgets,
  setLockWidgets,
  canSync,
  serverError,
  isRetrying,
  onRetrySync,
}) => {
  if (!isOpen) return null;

  const syncStatus = (() => {
    if (!canSync) {
      return { label: 'Cloud sync unavailable', detail: 'Server connection not configured', icon: CloudOff, tone: 'text-white/60 bg-white/10 border-white/10' };
    }
    if (serverError) {
      return { label: 'Sync paused', detail: 'Connection error while saving', icon: CloudOff, tone: 'text-rose-300 bg-rose-500/10 border-rose-500/20' };
    }
    return { label: 'Cloud sync active', detail: 'All changes are saved automatically', icon: Cloud, tone: 'text-white/80 bg-white/10 border-white/15' };
  })();

  const StatusIcon = syncStatus.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#111] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-semibold text-white">Dashboard Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
            {/* Title Setting */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-md text-white/70">
                        <Type className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white">Dashboard Title</h3>
                        <p className="text-xs text-white/40">Show the main title on home screen</p>
                    </div>
                </div>
                <ToggleSwitch
                    checked={showTitle}
                    onChange={setShowTitle}
                    label="Show dashboard title"
                />
            </div>

            {/* Search Preview Setting */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-md text-white/70">
                        <Search className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white">Search Previews</h3>
                        <p className="text-xs text-white/40">Show suggestions while typing</p>
                    </div>
                </div>
                <ToggleSwitch
                    checked={enableSearchPreview}
                    onChange={setEnableSearchPreview}
                    label="Enable search previews"
                />
            </div>

            {/* Widget Lock Setting */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-md text-white/70">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white">Lock Widgets</h3>
                        <p className="text-xs text-white/40">Disable widget dragging and editing</p>
                    </div>
                </div>
                <ToggleSwitch
                    checked={lockWidgets}
                    onChange={setLockWidgets}
                    label="Lock widgets"
                />
            </div>

            <div className="border-t border-white/10 pt-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${syncStatus.tone}`}>
                            <StatusIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-white">Cloud Sync</h3>
                            <p className="text-xs text-white/40">{syncStatus.label}</p>
                        </div>
                    </div>
                    {serverError && (
                        <button
                            onClick={onRetrySync}
                            disabled={isRetrying}
                            className="px-3 py-2 rounded-md text-xs font-medium bg-white/10 text-white/70 hover:text-white hover:bg-white/20 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                            {isRetrying ? 'Retrying' : 'Retry'}
                        </button>
                    )}
                </div>
                <p className="text-xs text-white/30 mt-3">{syncStatus.detail}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsModal;
