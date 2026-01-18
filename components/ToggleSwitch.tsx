import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`
      toggle-switch relative inline-flex h-7 w-14 items-center rounded-full border transition-all duration-200
      focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70
      ${checked
        ? 'bg-sky-300/90 border-sky-200/80 shadow-[0_0_12px_rgba(125,211,252,0.55)]'
        : 'bg-white/10 border-white/30 shadow-inner'}
    `}
  >
    <span
      className={`
        toggle-knob absolute left-0.5 top-0.5 h-6 w-6 rounded-full border transition-transform duration-200
        ${checked
          ? 'translate-x-7 bg-slate-900 border-sky-100/80'
          : 'translate-x-0 bg-white/80 border-white/80'}
      `}
    />
    <span className="sr-only">{label}</span>
  </button>
);

export default ToggleSwitch;
