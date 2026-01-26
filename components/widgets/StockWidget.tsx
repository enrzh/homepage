import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import { StockData, WidgetConfig } from '../../types';

interface StockWidgetProps {
  config: WidgetConfig;
}

const StockWidget: React.FC<StockWidgetProps> = ({ config }) => {
  const symbol = config.symbol || 'SPY';
  const refreshIntervalMs = 60_000;
  const [data, setData] = useState<StockData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [previousClose, setPreviousClose] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySymbol = symbol.toUpperCase();
      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${querySymbol}?interval=15m&range=1d`;
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const json = await response.json();
      const result = json.chart.result?.[0];
      
      if (!result) {
        throw new Error('Invalid symbol or no data');
      }

      const meta = result.meta;
      const timestamps = result.timestamp || [];
      const quotes = result.indicators.quote[0].close || [];
      
      const formattedData = timestamps.map((ts: number, i: number) => ({
        time: new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: quotes[i]
      })).filter((d: any) => d.value !== null && d.value !== undefined);

      if (formattedData.length === 0 && meta.regularMarketPrice) {
        formattedData.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: meta.regularMarketPrice
        });
      }

      const baseValue = formattedData[0]?.value ?? 0;
      const chartData: StockData[] = formattedData.map((point) => ({
        ...point,
        delta: baseValue ? ((point.value - baseValue) / baseValue) * 100 : 0
      }));

      setData(chartData);
      setCurrentPrice(meta.regularMarketPrice);
      setPreviousClose(meta.previousClose);
    } catch (err) {
      console.error("Stock fetch error:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshIntervalMs); 
    return () => clearInterval(interval);
  }, [symbol, refreshIntervalMs]);

  const isPositive = currentPrice && previousClose ? currentPrice >= previousClose : true;
  const percentChange = currentPrice && previousClose 
    ? ((currentPrice - previousClose) / previousClose * 100) 
    : 0;
  const priceChange = currentPrice && previousClose ? currentPrice - previousClose : 0;

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-white/50 group">
        <AlertCircle className="w-8 h-8 mb-2 opacity-50 group-hover:text-rose-300 transition-colors" />
        <span className="text-xs text-center mb-2">Could not load {symbol}</span>
        <button 
            onClick={fetchData} 
            className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-md text-xs flex items-center gap-1 transition-colors"
        >
            <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 md:p-4 text-white relative overflow-hidden group">
        {/* Header */}
        <div className="flex justify-between items-start mb-1 md:mb-2 relative z-10 gap-1 md:gap-2">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-[10px] md:text-xs font-bold text-white/50 uppercase tracking-wider truncate">
                        {config.customTitle || symbol}
                    </h3>
                    {loading && <RefreshCw className="w-3 h-3 animate-spin text-white/20" />}
                    {!loading && !error && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-slate-300/80 animate-pulse" title="Live" />
                    )}
                </div>
                <div className="text-xl md:text-3xl font-black flex items-center gap-2 tracking-tighter truncate overflow-hidden">
                    {currentPrice ? `$${currentPrice.toFixed(2)}` : '---'}
                </div>
            </div>
            <div className={`text-right flex flex-col items-end shrink-0 ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                <div className="text-xs md:text-sm font-medium flex items-center gap-1">
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(percentChange).toFixed(2)}%
                </div>
                <div className="text-[10px] md:text-xs opacity-70">
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}
                </div>
            </div>
        </div>
      
        {/* Chart */}
        <div className="flex-1 min-h-[80px] md:min-h-[100px] -mx-2 -mb-2 rounded-lg border border-white/5 bg-black/20 p-2">
            {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`colorValue-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPositive ? "#475569" : "#fca5a5"} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={isPositive ? "#475569" : "#fca5a5"} stopOpacity={0.05}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <Tooltip 
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                            return (
                                <div className="bg-[#111] border border-white/10 rounded-md p-2 text-xs shadow-xl">
                                <p className="text-white/50 mb-0.5">{payload[0].payload.time}</p>
                        <p className="font-bold text-white">${Number(payload[0].payload.value).toFixed(2)}</p>
                        <p className="text-[10px] text-white/40 mt-1">{Number(payload[0].value).toFixed(2)}%</p>
                                </div>
                            );
                            }
                            return null;
                        }}
                    />
                    <Area 
                        type="linear" 
                        dataKey="delta" 
                        stroke={isPositive ? "#94a3b8" : "#fca5a5"} 
                        fillOpacity={1} 
                        fill={`url(#colorValue-${symbol})`}
                        strokeWidth={2.5}
                        isAnimationActive={true}
                        animationDuration={1000}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: isPositive ? "#cbd5f5" : "#fecaca" }}
                    />
                </AreaChart>
            </ResponsiveContainer>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10 text-xs">
                    ...
                </div>
            )}
        </div>
    </div>
  );
};

export default StockWidget;
