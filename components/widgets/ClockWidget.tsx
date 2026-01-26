import React, { useState, useEffect } from 'react';
import { WidgetConfig } from '../../types';

interface ClockWidgetProps {
  config: WidgetConfig;
}

const ClockWidget: React.FC<ClockWidgetProps> = ({ config }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { use24Hour = false, showSeconds = false, showDate = true, customTitle } = config;

  return (
    <div className="h-full flex flex-col items-center justify-center text-white p-4 relative">
      {customTitle && (
        <div className="absolute top-3 left-4 text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-wider">
          {customTitle}
        </div>
      )}
      
      <div className={`font-black tracking-tighter ${showSeconds ? 'text-5xl md:text-6xl' : 'text-6xl md:text-8xl'}`}>
        {time.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: showSeconds ? '2-digit' : undefined,
            hour12: !use24Hour 
        })}
      </div>
      
      {showDate && (
        <div className="text-xs md:text-sm text-white/60 mt-1 md:mt-2 font-medium uppercase tracking-widest text-center">
            {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      )}
    </div>
  );
};

export default ClockWidget;