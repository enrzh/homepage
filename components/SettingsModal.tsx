import React from 'react';
import { X, Plus, Clock, Cloud, TrendingUp, Link } from 'lucide-react';
import { WidgetType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: WidgetType) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onAddWidget }) => {
  if (!isOpen) return null;

  const widgetTypes: { type: WidgetType; label: string; icon: React.ReactNode; desc: string }[] = [
    { type: 'clock', label: 'Clock', icon: <Clock className="w-6 h-6 text-slate-200" />, desc: 'Keep track of time' },
    { type: 'weather', label: 'Weather', icon: <Cloud className="w-6 h-6 text-slate-200" />, desc: 'Local conditions' },
    { type: 'stocks', label: 'Stock', icon: <TrendingUp className="w-6 h-6 text-slate-200" />, desc: 'Market tracker' },
    { type: 'shortcuts', label: 'Quick Links', icon: <Link className="w-6 h-6 text-slate-200" />, desc: 'Favorite sites' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-semibold text-white">Add Widget</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgetTypes.map((item) => (
                <button
                    key={item.type}
                    onClick={() => {
                        onAddWidget(item.type);
                        onClose();
                    }}
                    className="flex items-center gap-4 p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all text-left group"
                >
                    <div className="p-3 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors">
                        {item.icon}
                    </div>
                    <div>
                        <h3 className="font-medium text-white">{item.label}</h3>
                        <p className="text-sm text-white/40">{item.desc}</p>
                    </div>
                    <Plus className="w-5 h-5 text-white/20 ml-auto group-hover:text-white transition-colors" />
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
