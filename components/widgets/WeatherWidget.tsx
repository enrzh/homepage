import React, { useEffect, useState } from 'react';
import { Cloud, Sun, Moon, CloudRain, CloudSnow, CloudLightning, Loader2, MapPin } from 'lucide-react';
import { fetchWeather } from '../../services/weatherService';
import { WeatherData, WidgetConfig } from '../../types';

interface WeatherWidgetProps {
  config: WidgetConfig;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ config }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If config changes, reload
  useEffect(() => {
    const loadWeather = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!config.lat || !config.lon) {
                throw new Error('Set a city in settings');
            }

            const data = await fetchWeather(config.lat, config.lon);
            if (config.city) data.location = config.city;
            setWeather(data);
        } catch (err) {
            console.error(err);
            if (config.city) {
                setError(`Could not load ${config.city}`);
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Unable to load weather');
            }
        } finally {
            setLoading(false);
        }
    };

    loadWeather();
  }, [config.city, config.lat, config.lon]);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-white/50" /></div>;
  if (error) return <div className="h-full flex flex-col items-center justify-center text-xs text-rose-300 p-4 text-center"><span>{error}</span></div>;
  if (!weather) return null;

  const getIcon = () => {
    const { condition, isDay } = weather;
    const size = "w-8 h-8 md:w-10 md:h-10";
    if (condition === 'Clear') return isDay ? <Sun className={`${size} text-slate-200`} /> : <Moon className={`${size} text-slate-300`} />;
    if (condition === 'Rain') return <CloudRain className={`${size} text-slate-300`} />;
    if (condition === 'Snow') return <CloudSnow className={`${size} text-white`} />;
    if (condition === 'Storm') return <CloudLightning className={`${size} text-slate-200`} />;
    return <Cloud className={`${size} text-slate-300`} />;
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-white p-4 relative">
       {config.customTitle && (
        <div className="absolute top-3 left-4 text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-wider">
          {config.customTitle}
        </div>
      )}
      
      <div className="flex items-center gap-3 md:gap-4">
        {getIcon()}
        <div>
          <div className="text-3xl md:text-4xl font-bold">{Math.round(weather.temperature)}°</div>
          <div className="text-xs md:text-sm text-white/60 flex items-center gap-1">
             {config.city && <MapPin className="w-3 h-3" />}
             {weather.condition}
          </div>
        </div>
      </div>
      {/* City Label if not custom title */}
      {!config.customTitle && config.city && (
          <div className="absolute bottom-3 text-[10px] md:text-xs text-white/40 font-medium">
              {config.city}
          </div>
      )}
    </div>
  );
};

export default WeatherWidget;
