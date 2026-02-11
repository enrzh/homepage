export type WidgetType = 'weather' | 'stocks' | 'shortcuts' | 'clock';

export interface ShortcutLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface WidgetConfig {
  // General
  customTitle?: string;
  colSpan?: 1 | 2; // 1 = regular, 2 = wide
  tint?: string;   // css class for gradient or color

  // Stocks
  symbol?: string; 
  dataSource?: 'yahoo' | 'tradingview';
  
  // Weather
  city?: string;
  lat?: number;
  lon?: number;

  // Clock
  use24Hour?: boolean;
  showSeconds?: boolean;
  showDate?: boolean;

  // Shortcuts
  links?: ShortcutLink[]; 

  [key: string]: any;
}

export interface WidgetData {
  id: string;      // Unique instance ID
  type: WidgetType;
  title: string;
  config: WidgetConfig;
}

export interface StockData {
  time: string;
  value: number;
  delta?: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  isDay: boolean;
}

