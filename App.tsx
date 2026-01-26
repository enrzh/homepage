import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Settings, Activity, Search, Layout, ArrowRightLeft, Check, X, Trash2, Save, Pencil, GripVertical, Plus } from 'lucide-react';import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { WidgetData, WidgetType, ShortcutLink, WidgetConfig } from './types';
import SearchBar from './components/SearchBar';
import WeatherWidget from './components/widgets/WeatherWidget';
import StockWidget from './components/widgets/StockWidget';
import ClockWidget from './components/widgets/ClockWidget';
import ShortcutsWidget from './components/widgets/ShortcutsWidget';
import SettingsModal from './components/SettingsModal';
import GlobalSettingsModal from './components/GlobalSettingsModal';
import ToggleSwitch from './components/ToggleSwitch';
import { v4 as uuidv4 } from 'uuid';

const API_URL = (() => {
    if (typeof window === 'undefined') return null;
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl;
    return '/api/settings';
})();

const DEFAULT_WIDGETS: WidgetData[] = [
  { id: '1', type: 'clock', title: 'Clock', config: { showDate: true, showSeconds: false, use24Hour: false, colSpan: 2 } },
  { id: '2', type: 'weather', title: 'Weather', config: { tint: 'blue' } },
  { id: '3', type: 'stocks', title: 'SPY', config: { symbol: 'SPY', tint: 'green' } },
];

const TINTS: { id: string; class: string; name: string }[] = [
    { id: 'default', class: 'bg-slate-900/80', name: 'Slate' },
    { id: 'blue', class: 'bg-slate-900/70', name: 'Steel' },
    { id: 'purple', class: 'bg-slate-800/70', name: 'Graphite' },
    { id: 'green', class: 'bg-slate-900/60', name: 'Charcoal' },
    { id: 'orange', class: 'bg-slate-800/60', name: 'Smoke' },
];

const ensureWidgetConfig = (widget: WidgetData): WidgetData => ({
    ...widget,
    config: widget.config ?? {},
});

const buildWidgetOrder = (items: WidgetData[]) => items.map((widget) => widget.id);

const reorderWidgets = (items: WidgetData[], order: string[]) => {
    const widgetMap = new Map(items.map((widget) => [widget.id, widget]));
    const ordered = order.map((id) => widgetMap.get(id)).filter(Boolean) as WidgetData[];
    const remaining = items.filter((widget) => !order.includes(widget.id));
    return [...ordered, ...remaining];
};

// Standalone render function for use in App and Editor
const renderWidgetContent = (widget: WidgetData) => {
    switch (widget.type) {
      case 'clock': return <ClockWidget config={widget.config} />;
      case 'weather': return <WeatherWidget config={widget.config} />;
      case 'stocks': return <StockWidget config={widget.config} />;
      case 'shortcuts': return <ShortcutsWidget config={widget.config} />;
      default: return null;
    }
};

const App: React.FC = () => {
  // State
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [widgetOrder, setWidgetOrder] = useState<string[]>([]);
  const orderedWidgets = useMemo(() => reorderWidgets(widgets, widgetOrder), [widgets, widgetOrder]);
  const [appTitle, setAppTitle] = useState('Homepage');
  const [showTitle, setShowTitle] = useState(true);
  const [enableSearchPreview, setEnableSearchPreview] = useState(true);
  const [lockWidgets, setLockWidgets] = useState(false);
  
  // System State
  const [isLoaded, setIsLoaded] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [canSync, setCanSync] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const saveQueueRef = useRef(Promise.resolve());

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

  // Load Settings from Server
  const applySettings = useCallback((data: Partial<{
    widgets: WidgetData[];
    appTitle: string;
    showTitle: boolean;
    enableSearchPreview: boolean;
    lockWidgets: boolean;
  }>) => {
    const nextWidgets = (data.widgets ?? DEFAULT_WIDGETS)
      .map(ensureWidgetConfig);
    setWidgets(nextWidgets);
    setWidgetOrder(buildWidgetOrder(nextWidgets));
    setAppTitle(data.appTitle ?? 'Homepage');
    setShowTitle(data.showTitle !== undefined ? data.showTitle : true);
    setEnableSearchPreview(data.enableSearchPreview !== undefined ? data.enableSearchPreview : true);
    setLockWidgets(data.lockWidgets !== undefined ? data.lockWidgets : false);
  }, []);

  const fetchSettings = useCallback(async () => {
      if (!API_URL) {
        applySettings({});
        setIsLoaded(true);
        setServerError(false);
        setCanSync(false);
        return;
      }

      try {
          const res = await fetch(API_URL);
          if (!res.ok) throw new Error('Failed to fetch settings');
          const data = await res.json();

          applySettings(data);

          setIsLoaded(true);
          setServerError(false);
          setCanSync(true);
      } catch (err) {
          console.error(err);
          applySettings({});
          setIsLoaded(true);
          setServerError(true);
          setCanSync(false);
      }
  }, [applySettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveData = useCallback(async (payload: {
    widgets: WidgetData[];
    appTitle: string;
    showTitle: boolean;
    enableSearchPreview: boolean;
    lockWidgets: boolean;
  }) => {
    if (!API_URL || !canSync) return;

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        setServerError(false);
    } catch (err) {
        console.error("Failed to save:", err);
        setServerError(true);
        setCanSync(false);
    }
  }, [canSync]);

  // Save Settings to Server (Debounced)
  useEffect(() => {
    if (!isLoaded) return; // Don't save before initial load

    const timer = setTimeout(() => {
        const payload = {
            widgets,
            appTitle,
            showTitle,
            enableSearchPreview,
            lockWidgets
        };

        saveQueueRef.current = saveQueueRef.current.then(() => saveData(payload));
    }, 500);

    return () => clearTimeout(timer);
  }, [widgets, appTitle, showTitle, enableSearchPreview, lockWidgets, isLoaded, saveData]);

  useEffect(() => {
    if (lockWidgets && editingWidgetId) {
      setEditingWidgetId(null);
    }
  }, [lockWidgets, editingWidgetId]);

  const retrySync = async () => {
      setIsRetrying(true);
      await fetchSettings();
      setIsRetrying(false);
  };


  const addWidget = (type: WidgetType) => {
    const newWidget: WidgetData = {
      id: uuidv4(),
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      config: type === 'stocks'
        ? { symbol: 'AAPL' }
        : type === 'clock'
          ? { showDate: true, colSpan: 2 }
          : {},
    };
    setWidgets((prev) => [...prev, newWidget]);
    setWidgetOrder((prev) => [...prev, newWidget.id]);
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter(w => w.id !== id));
    setWidgetOrder((prev) => prev.filter((widgetId) => widgetId !== id));
    if (editingWidgetId === id) setEditingWidgetId(null);
  };

  const updateWidgetFull = (id: string, updates: Partial<WidgetData>) => {
      setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  return (
    <div className="h-[100dvh] w-full bg-[#0f1217] text-slate-100 font-sans overflow-hidden flex flex-col relative selection:bg-slate-400/20">

        {/* Scrollable Main Content Area */}
        <div className="flex-1 overflow-y-auto w-full relative z-10 custom-scrollbar scroll-smooth">
            <div className="flex flex-col min-h-full w-full p-4 md:p-8 pb-32 md:pb-10 gap-6 md:gap-10">
                
                {/* Top Bar (Actions) - Made subtle */}
                <div className="flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setIsGlobalSettingsOpen(true)}
                            className="flex items-center justify-center w-11 h-11 md:w-10 md:h-10 rounded-md text-white/40 hover:text-white transition-colors active:scale-95 bg-white/5 hover:bg-white/10 border border-white/10"
                            title="Settings"
                        >
                            <Settings className="w-6 h-6 md:w-5 md:h-5" />
                        </button>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center justify-center w-11 h-11 md:w-10 md:h-10 rounded-md text-white/70 hover:text-white transition-colors active:scale-95 bg-white/10 hover:bg-white/15 border border-white/10"
                            title="Add Widget"
                        >
                            <span className="text-2xl leading-none">+</span>
                        </button>
                    </div>
                </div>

                {/* Header (Title) */}
                {showTitle && (
                    <div className="w-full flex justify-center mt-2 md:mt-6 shrink-0">
                        <input
                            value={appTitle}
                            onChange={(e) => setAppTitle(e.target.value)}
                            className="text-4xl md:text-6xl font-semibold bg-white/5 text-center border border-white/10 outline-none text-white/90 placeholder-white/20 tracking-tight w-full max-w-3xl hover:bg-white/10 hover:border-white/20 focus:border-slate-300/40 rounded-lg transition-all px-4 md:px-6 py-3"
                            placeholder="Dashboard Name"
                        />
                    </div>
                )}

                {/* Desktop Search Bar (Hidden on Mobile inside scroll view) */}
                <div className="hidden md:flex w-full justify-center shrink-0">
                    <SearchBar enablePreview={enableSearchPreview} />
                </div>

                {/* Widgets Grid */}
                <div className="w-full">
                    {/* Loading State */}
                    {!isLoaded && (
                         <div className="w-full h-64 flex items-center justify-center text-white/20 animate-pulse">
                            Loading Dashboard...
                        </div>
                    )}
                    
                    {/* Grid */}
                    {isLoaded && (
                    <Reorder.Group 
                        axis="y" 
                        values={widgetOrder} 
                        onReorder={(nextOrder) => {
                            setWidgetOrder(nextOrder);
                            setWidgets((prev) => reorderWidgets(prev, nextOrder));
                        }} 
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 list-none p-0 m-0"
                        as="ul"
                    >
                        <AnimatePresence mode="popLayout">
                        {orderedWidgets.map((widget) => {
                            const isBeingEdited = editingWidgetId === widget.id;
                            return (
                                <Reorder.Item
                                    key={widget.id}
                                    value={widget.id}
                                    drag={!isBeingEdited && !lockWidgets}
                                    dragMomentum={false}
                                    whileDrag={{ 
                                        scale: 1.05, 
                                        zIndex: 100, 
                                        cursor: "grabbing", 
                                        backgroundColor: "rgba(30, 30, 30, 0.9)",
                                        backdropFilter: "blur(12px)"
                                    }}
                                    layout
                                    className={`
                                        relative group list-none rounded-lg
                                        ${widget.config.colSpan === 2 ? 'col-span-2' : 'col-span-1'}
                                        h-[180px] sm:h-[190px] md:h-[200px]
                                    `}
                                    as="li"
                                >
                                    <div className={`w-full h-full transition-opacity duration-300 ${isBeingEdited ? 'opacity-0' : 'opacity-100'}`}>
                                         <WidgetCard 
                                            widget={widget} 
                                            onRemove={() => removeWidget(widget.id)}
                                            onEditStart={() => setEditingWidgetId(widget.id)}
                                            layoutId={`widget-container-${widget.id}`}
                                            isLocked={lockWidgets}
                                        >
                                            {renderWidgetContent(widget)}
                                        </WidgetCard>
                                    </div>
                                    {isBeingEdited && <div className="absolute inset-0 bg-white/5 rounded-lg border border-white/5" />}
                                </Reorder.Item>
                            );
                        })}
                        </AnimatePresence>
                    </Reorder.Group>
                    )}
                </div>
            </div>
        </div>

        {/* Mobile Fixed Bottom Search Bar */}
        <div className={`
            md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-12 
            bg-gradient-to-t from-[#0b0e12] via-[#0b0e12] to-transparent
            flex justify-center pointer-events-none
        `}>
            <div className="w-full pointer-events-auto">
                 <SearchBar enablePreview={enableSearchPreview} />
            </div>
        </div>

        {/* Edit Modal */}
        {editingWidgetId && (
            <EditWidgetModal 
                widgetId={editingWidgetId}
                widgets={widgets}
                onUpdate={updateWidgetFull}
                onClose={() => setEditingWidgetId(null)}
                onRemove={removeWidget}
            />
        )}

        <SettingsModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
            onAddWidget={addWidget}
        />
        
        <GlobalSettingsModal
            isOpen={isGlobalSettingsOpen}
            onClose={() => setIsGlobalSettingsOpen(false)}
            showTitle={showTitle}
            setShowTitle={setShowTitle}
            enableSearchPreview={enableSearchPreview}
            setEnableSearchPreview={setEnableSearchPreview}
            lockWidgets={lockWidgets}
            setLockWidgets={setLockWidgets}
            canSync={canSync}
            serverError={serverError}
            isRetrying={isRetrying}
            onRetrySync={retrySync}
        />
    </div>
  );
};

// -- Components --

// 1. Widget Card (Grid Item)
const WidgetCard: React.FC<{
    widget: WidgetData;
    children: React.ReactNode;
    onEditStart: () => void;
    layoutId: string;
    isLocked: boolean;
}> = ({ widget, children, onRemove, onEditStart, layoutId, isLocked }) => {
    const tintConfig = TINTS.find(t => t.id === widget.config.tint) || TINTS[0];
    const bgClass = tintConfig.class;

    return (
        <motion.div 
            layoutId={layoutId}
            onDoubleClick={() => {
                if (!isLocked) {
                    onEditStart();
                }
            }}
            className={`
                w-full h-full relative overflow-hidden border border-white/5 hover:border-white/20 transition-all
                backdrop-blur-md bg-white/5 shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]
                hover:-translate-y-0.5 group rounded-lg
                ${bgClass}
            `}
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5" />
            {!isLocked && (
                <div className="absolute top-2 right-2 z-20 flex gap-1 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                     <button 
                            onClick={(e) => { 
                                e.stopPropagation();
                                onEditStart();
                            }}
                            className="p-1.5 rounded-md bg-black/50 text-white/70 hover:bg-black/70 hover:text-white transition-all"
                        >
                            <Settings className="w-3 h-3" />
                        </button>
                </div>
            )}
            <div className="relative h-full w-full">{children}</div>
        </motion.div>
    );
};

// 2. Edit Modal Wrapper
const EditWidgetModal: React.FC<{
    widgetId: string;
    widgets: WidgetData[];
    onUpdate: (id: string, updates: Partial<WidgetData>) => void;
    onClose: () => void;
    onRemove: (id: string) => void;
}> = ({ widgetId, widgets, onUpdate, onClose, onRemove }) => {
    // Find widget from props to initialize
    const originalWidget = widgets.find(w => w.id === widgetId);
    
    // If not found, close
    if (!originalWidget) {
        onClose();
        return null;
    }

    return (
        <>
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/40 backdrop-blur-xl z-40"
            />
            {/* Removed p-4 on mobile to allow full screen take-over */}
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none md:p-4">
                 <EditConfigPanel 
                    widget={originalWidget} 
                    onUpdate={(updates) => onUpdate(widgetId, updates)} 
                    onClose={onClose}
                    onRemove={() => onRemove(widgetId)}
                 />
            </div>
        </>
    );
};

// 3. Edit Configuration Panel (The Logic Core)
const EditConfigPanel: React.FC<{
    widget: WidgetData;
    onUpdate: (updates: Partial<WidgetData>) => void;
    onClose: () => void;
    onRemove: () => void;
}> = ({ widget, onUpdate, onClose, onRemove }) => {
    
    // Local state to prevent typing blocking and allow "Live Preview" without committing to App state immediately
    const [localConfig, setLocalConfig] = useState<WidgetConfig>(widget.config);
    const [localTitle, setLocalTitle] = useState(widget.config.customTitle || '');
    // Direct update wrapper for toggles/selectors
    const updateConfigImmediate = (updates: Partial<WidgetConfig>) => {
        const newConfig = { ...localConfig, ...updates };
        setLocalConfig(newConfig);
        onUpdate({ config: newConfig });
    };

    // Debounced update for Title
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localTitle !== widget.config.customTitle) {
                onUpdate({ config: { ...localConfig, customTitle: localTitle } });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localTitle]);

    // Construct a temporary widget object for the Live Preview
    const previewWidget: WidgetData = {
        ...widget,
        config: { ...localConfig, customTitle: localTitle }
    };

    const tintConfig = TINTS.find(t => t.id === localConfig.tint) || TINTS[0];

    return (
        <div
            className={`
                pointer-events-auto
                w-full max-w-5xl
                h-full md:h-[650px] md:max-h-[90vh]
                flex flex-col md:flex-row
                md:rounded-xl border-0 md:border border-white/10 shadow-2xl overflow-hidden
                bg-[#0a0a0a]/90 backdrop-blur-2xl
            `}
        >
            {/* Left/Top: Preview Area */}
            <div className={`
                relative shrink-0 md:flex-1 p-8 md:p-12 flex flex-col items-center justify-center
                ${tintConfig.class}
                border-b md:border-b-0 md:border-r border-white/5
                min-h-[260px] md:min-h-[300px]
            `}>
                <div className="absolute top-4 left-4 text-xs font-bold text-white/30 uppercase tracking-widest hidden md:block">Live Preview</div>
                <div className="absolute top-4 right-4 md:hidden z-50">
                     <button onClick={onClose} className="p-2 bg-black/20 hover:bg-black/40 rounded-md text-white" title="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* The Actual Widget Component */}
                <div className={`
                    w-full max-w-[240px] md:max-w-[300px] aspect-square rounded-lg border border-white/10 shadow-xl overflow-hidden bg-black/10
                    ${localConfig.colSpan === 2 ? 'aspect-[2/1] max-w-[400px] md:max-w-[500px]' : ''}
                `}>
                    {renderWidgetContent(previewWidget)}
                </div>

            </div>

            {/* Right/Bottom: Settings Panel */}
            <div className="flex-1 flex flex-col bg-[#111] min-w-0 md:min-w-[320px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 md:py-6 border-b border-white/5 bg-white/[0.01] shrink-0">
                    <div className="flex flex-col w-full mr-4">
                        <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold mb-1">
                            Editing {widget.type}
                        </span>
                        <input 
                            value={localTitle}
                            onChange={(e) => setLocalTitle(e.target.value)}
                            placeholder="Widget Title"
                            className="bg-transparent text-xl font-semibold text-white placeholder-white/20 outline-none w-full"
                        />
                    </div>
                    <div className="flex gap-2 shrink-0">
                         <button onClick={onRemove} className="p-2 bg-white/5 hover:bg-rose-500/15 text-white/40 hover:text-rose-300 rounded-md transition-colors" title="Delete Widget">
                             <Trash2 className="w-5 h-5" />
                         </button>
                         <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors hidden md:block" title="Close">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8 pb-24 md:pb-8">
                    {/* Appearance Size */}
                    <div className="space-y-4">
                         <label className="text-xs font-bold text-white/30 uppercase tracking-widest">Layout</label>
                         <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => updateConfigImmediate({ colSpan: 1 })}
                                className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all
                                ${(!localConfig.colSpan || localConfig.colSpan === 1) ? 'bg-white/10 border-white/30 text-white' : 'border-white/5 text-white/40 hover:bg-white/5'}`}
                            >
                                <Layout className="w-4 h-4" /> <span className="text-sm">Regular</span>
                            </button>
                            <button 
                                onClick={() => updateConfigImmediate({ colSpan: 2 })}
                                className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all
                                ${localConfig.colSpan === 2 ? 'bg-white/10 border-white/30 text-white' : 'border-white/5 text-white/40 hover:bg-white/5'}`}
                            >
                                <ArrowRightLeft className="w-4 h-4" /> <span className="text-sm">Wide</span>
                            </button>
                        </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Type Specific Settings */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Configuration</label>
                        
                        {widget.type === 'clock' && (
                             <div className="space-y-2">
                                {[
                                    { label: 'Show Date', key: 'showDate' },
                                    { label: 'Show Seconds', key: 'showSeconds' },
                                    { label: '24-Hour Clock', key: 'use24Hour' },
                                ].map((opt) => (
                                    <div key={opt.key} className="flex items-center justify-between text-sm text-white/80 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                        <span>{opt.label}</span>
                                        <ToggleSwitch
                                            checked={!!localConfig[opt.key]}
                                            onChange={(checked) => updateConfigImmediate({ [opt.key]: checked })}
                                            label={opt.label}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {widget.type === 'weather' && (
                            <WeatherSettings 
                                config={localConfig} 
                                onUpdate={updateConfigImmediate} 
                            />
                        )}

                        {widget.type === 'stocks' && (
                             <StockSettings 
                                config={localConfig}
                                onUpdate={updateConfigImmediate}
                             />
                        )}

                        {widget.type === 'shortcuts' && (
                            <ShortcutsSettings 
                                config={localConfig}
                                onUpdate={updateConfigImmediate}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// -- Sub-Settings Components to isolate heavy logic --

const WeatherSettings: React.FC<{
    config: WidgetConfig;
    onUpdate: (u: Partial<WidgetConfig>) => void;
}> = ({ config, onUpdate }) => {
    const [cityInput, setCityInput] = useState(config.city || '');
    const [isSearching, setIsSearching] = useState(false);

    // Only update the parent (and thus the preview) when explicitly requested
    const handleSearch = async () => {
        if (!cityInput.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&count=1&language=en&format=json`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const loc = data.results[0];
                // Update parent config completely
                onUpdate({ 
                    lat: loc.latitude, 
                    lon: loc.longitude, 
                    city: loc.name,
                    // Auto-set title if it wasn't custom, or just rely on widget to show city
                    customTitle: config.customTitle // Keep existing title
                });
            } else {
                alert("City not found");
            }
        } catch (e) {
            console.error(e);
            alert("Error searching city");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2">
                <label className="text-sm text-white/60">Location</label>
                <div className="flex gap-2">
                    <input 
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Enter City Name"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-slate-300/60 transition-all"
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-4 bg-white/10 hover:bg-white/15 text-white/70 rounded-lg transition-colors font-medium text-sm border border-white/10 flex items-center"
                    >
                        {isSearching ? <Activity className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                </div>
            </div>
            
            <p className="text-[10px] text-white/40">Search saves the city for this widget.</p>
        </div>
    );
};

const StockSettings: React.FC<{
    config: WidgetConfig;
    onUpdate: (u: Partial<WidgetConfig>) => void;
}> = ({ config, onUpdate }) => {
    const [symbolInput, setSymbolInput] = useState(config.symbol || '');

    // Debounce update to preview while typing
    useEffect(() => {
        const timer = setTimeout(() => {
            if (symbolInput && symbolInput !== config.symbol) {
                 onUpdate({ symbol: symbolInput.toUpperCase() });
            }
        }, 600); // 600ms delay to avoid hitting API on every keystroke

        return () => clearTimeout(timer);
    }, [symbolInput, config.symbol, onUpdate]);

    return (
        <div className="space-y-3">
             <div className="flex flex-col gap-2">
                <label className="text-sm text-white/60">Stock Symbol</label>
                 <div className="relative">
                    <input 
                        type="text" 
                        value={symbolInput}
                        onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-slate-300/60 font-mono uppercase tracking-wider"
                        placeholder="SPY"
                    />
                    <div className="absolute right-3 top-3.5 pointer-events-none">
                        {symbolInput !== config.symbol ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
                        ) : (
                             <Check className="w-4 h-4 text-white/60" />
                        )}
                    </div>
                </div>
                <p className="text-[10px] text-white/40">Preview updates automatically</p>
            </div>
        </div>
    );
};

const ShortcutsSettings: React.FC<{
    config: WidgetConfig;
    onUpdate: (u: Partial<WidgetConfig>) => void;
}> = ({ config, onUpdate }) => {
    const [linkTitle, setLinkTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    
    const links = config.links || [];

    const getFavicon = (url: string) => {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch {
            return '';
        }
    };

    const handleSubmit = () => {
        if (!linkTitle || !linkUrl) return;
        
        let newLinks = [...links];
        if (editId) {
            newLinks = newLinks.map(l => l.id === editId ? { ...l, title: linkTitle, url: linkUrl } : l);
            setEditId(null);
        } else {
            newLinks.push({ id: uuidv4(), title: linkTitle, url: linkUrl });
        }
        
        onUpdate({ links: newLinks });
        setLinkTitle('');
        setLinkUrl('');
    };

    const handleEdit = (link: ShortcutLink) => {
        setLinkTitle(link.title);
        setLinkUrl(link.url);
        setEditId(link.id);
    };

    const handleCancel = () => {
         setLinkTitle('');
         setLinkUrl('');
         setEditId(null);
    }

    return (
        <div className="space-y-4">
             <div className="p-4 bg-white/5 rounded-lg space-y-3 border border-white/5">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white/60 uppercase">{editId ? 'Edit Shortcut' : 'New Shortcut'}</span>
                    {editId && <button onClick={handleCancel} className="text-xs text-rose-300 hover:underline">Cancel</button>}
                </div>
                <div className="flex flex-col gap-2">
                    <input 
                        placeholder="Title (e.g. YouTube)" 
                        value={linkTitle} 
                        onChange={e => setLinkTitle(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
                    />
                    <input 
                        placeholder="URL (https://...)" 
                        value={linkUrl} 
                        onChange={e => setLinkUrl(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30 font-mono text-xs"
                    />
                </div>
                <button 
                    onClick={handleSubmit} 
                    disabled={!linkTitle || !linkUrl} 
                    className={`w-full py-2 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2
                        ${editId ? 'bg-white/15 text-white hover:bg-white/20' : 'bg-white/10 hover:bg-white/20 text-white'}
                    `}
                >
                    {editId ? <Save className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {editId ? 'Update Shortcut' : 'Add Shortcut'}
                </button>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Active Links</label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {links.map(l => (
                        <div key={l.id} className={`flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg border transition-all ${editId === l.id ? 'border-white/20 bg-white/10' : 'border-transparent hover:border-white/10'}`}>
                             {/* Favicon */}
                            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img src={getFavicon(l.url)} className="w-4 h-4" onError={(e) => (e.target as HTMLImageElement).style.opacity = '0'} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-white font-medium truncate">{l.title}</div>
                                <div className="text-[10px] text-white/30 truncate">{l.url}</div>
                            </div>

                            <div className="flex gap-1">
                                <button 
                                    onClick={() => handleEdit(l)}
                                    className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <Pencil className="w-3 h-3" />
                                </button>
                                <button 
                                    onClick={() => {
                                        const newLinks = links.filter(x => x.id !== l.id);
                                        onUpdate({ links: newLinks });
                                        if (editId === l.id) handleCancel();
                                    }} 
                                    className="p-1.5 text-white/40 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {links.length === 0 && (
                        <div className="text-center py-6 text-white/20 text-xs border border-dashed border-white/5 rounded-lg">
                            No shortcuts added yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
