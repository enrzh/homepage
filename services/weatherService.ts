import { WeatherData } from "../types";

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,is_day,weather_code&timezone=auto`
    );
    const data = await response.json();
    
    const code = data.current.weather_code;
    const isDay = data.current.is_day === 1;
    let condition = "Unknown";
    
    // Simple WMO code mapping
    if (code === 0) condition = "Clear";
    else if (code >= 1 && code <= 3) condition = "Cloudy";
    else if (code >= 45 && code <= 48) condition = "Fog";
    else if (code >= 51 && code <= 67) condition = "Rain";
    else if (code >= 71 && code <= 77) condition = "Snow";
    else if (code >= 95) condition = "Storm";

    return {
      temperature: data.current.temperature_2m,
      condition,
      location: "Local Weather", // OpenMeteo doesn't return city name, would need reverse geocoding
      isDay
    };
  } catch (e) {
    console.error("Weather fetch failed", e);
    throw e;
  }
};
