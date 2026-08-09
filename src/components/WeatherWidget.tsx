import React, { useState, useEffect } from 'react';
import { 
  Sun, CloudRain, CloudSnow, Cloud, CloudSun, CloudLightning, 
  Wind, Navigation, Search, MapPin, AlertCircle, RefreshCw, Thermometer, Droplets
} from 'lucide-react';

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  cityName: string;
  country?: string;
  latitude: number;
  longitude: number;
  forecast: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    precipProb: number;
  }>;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [searchCity, setSearchCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoPromptBlocked, setGeoPromptBlocked] = useState(false);

  // Default coordinate (Saskatchewan farming area or standard default)
  const DEFAULT_LAT = 50.62;
  const DEFAULT_LNG = -104.86;
  const DEFAULT_CITY = 'Regina (Default)';

  useEffect(() => {
    // Try to get weather for saved coordinates, or default to geolocation
    const savedLat = localStorage.getItem('farmai_weather_lat');
    const savedLng = localStorage.getItem('farmai_weather_lng');
    const savedName = localStorage.getItem('farmai_weather_name');

    if (savedLat && savedLng && savedName) {
      fetchWeather(parseFloat(savedLat), parseFloat(savedLng), savedName);
    } else {
      detectLocation();
    }
  }, []);

  const detectLocation = () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      fetchWeather(DEFAULT_LAT, DEFAULT_LNG, DEFAULT_CITY);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude, 'Local Farm');
      },
      (err) => {
        console.warn('Geolocation blocked or error:', err);
        setGeoPromptBlocked(true);
        // Fallback to default
        fetchWeather(DEFAULT_LAT, DEFAULT_LNG, DEFAULT_CITY);
      },
      { timeout: 10000 }
    );
  };

  const fetchWeather = async (lat: number, lng: number, cityName: string, country?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch current and daily forecast
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to retrieve weather data from Open-Meteo.');
      }

      const data = await response.json();
      
      if (!data.current_weather) {
        throw new Error('No weather data received.');
      }

      // Map daily forecast
      const forecastList = [];
      if (data.daily) {
        const times = data.daily.time || [];
        const maxTemps = data.daily.temperature_2m_max || [];
        const minTemps = data.daily.temperature_2m_min || [];
        const precipProbs = data.daily.precipitation_probability_max || [];

        for (let i = 0; i < Math.min(times.length, 5); i++) {
          forecastList.push({
            date: new Date(times[i]).toLocaleDateString(undefined, { weekday: 'short' }),
            tempMax: maxTemps[i],
            tempMin: minTemps[i],
            precipProb: precipProbs[i] ?? 0,
          });
        }
      }

      setWeather({
        temperature: data.current_weather.temperature,
        windspeed: data.current_weather.windspeed,
        weathercode: data.current_weather.weathercode,
        cityName,
        country,
        latitude: lat,
        longitude: lng,
        forecast: forecastList,
      });

      // Save to localStorage for persistence
      localStorage.setItem('farmai_weather_lat', lat.toString());
      localStorage.setItem('farmai_weather_lng', lng.toString());
      localStorage.setItem('farmai_weather_name', cityName);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching weather forecasts.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity.trim())}&count=1`;
      const response = await fetch(geoUrl);
      if (!response.ok) {
        throw new Error('City lookup failed.');
      }
      
      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        throw new Error(`Could not find coordinates for "${searchCity}".`);
      }

      const result = data.results[0];
      const { latitude, longitude, name, country } = result;
      
      await fetchWeather(latitude, longitude, name, country);
      setSearchCity('');
    } catch (err: any) {
      setError(err.message || 'Error searching for city.');
      setIsLoading(false);
    }
  };

  // Weather interpretation helper
  const getWeatherInfo = (code: number) => {
    // Return description & appropriate Lucide Icon
    if (code === 0) return { desc: 'Sunny / Clear', icon: <Sun className="w-8 h-8 text-amber-500" /> };
    if ([1, 2, 3].includes(code)) return { desc: 'Partly Cloudy', icon: <CloudSun className="w-8 h-8 text-neutral-400" /> };
    if ([45, 48].includes(code)) return { desc: 'Foggy', icon: <Cloud className="w-8 h-8 text-neutral-300" /> };
    if ([51, 53, 55, 56, 57].includes(code)) return { desc: 'Drizzle', icon: <CloudRain className="w-8 h-8 text-sky-400" /> };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { desc: 'Rainy', icon: <CloudRain className="w-8 h-8 text-sky-600 animate-pulse" /> };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { desc: 'Snowy', icon: <CloudSnow className="w-8 h-8 text-blue-200" /> };
    if ([95, 96, 99].includes(code)) return { desc: 'Thunderstorms', icon: <CloudLightning className="w-8 h-8 text-amber-600" /> };
    return { desc: 'Overcast', icon: <Cloud className="w-8 h-8 text-neutral-500" /> };
  };

  // Agricultural specific advice based on weather parameters
  const getFarmingAdvice = (temp: number, code: number, forecast: Array<any>) => {
    const isRaining = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(code);
    const rainUpcoming = forecast.some(day => day.precipProb > 40);

    if (temp >= 32) {
      return {
        title: 'Critical High Temperature Alert',
        advice: 'Intense heat increases transpiration rates. Increase watering cycle frequencies, apply straw or organic mulch immediately to protect delicate topsoil, and postpone any foliage-based chemical sprays to prevent leaf scorch.',
        severity: 'high'
      };
    }
    
    if (temp <= 4) {
      return {
        title: 'Frost Risk Warning',
        advice: 'Near-freezing temperatures threaten tender crops (tomatoes, peppers, seedlings). Implement physical covers or polytunnels tonight. Maintain soil moisture as wet soil radiates heat better than parched dry soil.',
        severity: 'high'
      };
    }

    if (isRaining) {
      return {
        title: 'Active Rainfall Event',
        advice: 'Precipitation is active. Temporarily disable automatic greenhouse or field irrigation systems. Avoid distributing powdery fertilizer granules as they will wash off. Check low-lying plots for water logging.',
        severity: 'medium'
      };
    }

    if (rainUpcoming) {
      return {
        title: 'Precipitation Expected Soon',
        advice: 'High likelihood of upcoming rain. Perfect opportunity to weed before soil loosens, but delay any chemical pesticide applications as they will be washed away. Ensure drainage gates are clear.',
        severity: 'medium'
      };
    }

    if (temp >= 15 && temp <= 26) {
      return {
        title: 'Optimal Cultivation Conditions',
        advice: 'Atmospheric conditions are exceptionally stable. Highly favorable for direct-sowing seeds, applying organic biological sprays (like compost tea), transplanting seedlings, and carrying out general soil aerations.',
        severity: 'good'
      };
    }

    return {
      title: 'Stable Farming Conditions',
      advice: 'Perform routine crop inspection. Monitor lower leaves for blight nodes and maintain standard seasonal irrigation schedules based on your crop calendar.',
      severity: 'good'
    };
  };

  const weatherInfo = weather ? getWeatherInfo(weather.weathercode) : null;
  const farmingAdvice = weather ? getFarmingAdvice(weather.temperature, weather.weathercode, weather.forecast) : null;

  return (
    <div id="weather-widget-card" className="bg-white border border-editorial-border rounded-none p-6 shadow-xs space-y-6">
      
      {/* Widget Header with manual input */}
      <div id="weather-widget-header" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-editorial-border/60 pb-4">
        <div>
          <h3 className="font-serif font-bold text-editorial-dark text-lg uppercase tracking-wide flex items-center gap-2">
            <Sun className="w-5 h-5 text-editorial-forest" /> Microclimate Advisory
          </h3>
          <p className="text-[10px] text-editorial-sage font-sans uppercase tracking-wider font-bold mt-0.5">
            Real-time farm weather integration
          </p>
        </div>

        {/* City Lookup and Auto Geolocation */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleCitySearch} className="flex items-center border border-editorial-border bg-editorial-cream/15 flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search City..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 focus:outline-none bg-transparent text-editorial-dark font-sans placeholder-editorial-sage/60 w-full sm:w-36"
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="p-1.5 text-editorial-sage hover:text-editorial-dark border-l border-editorial-border transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            onClick={detectLocation}
            disabled={isLoading}
            className="p-2 border border-editorial-border hover:bg-editorial-sand/40 text-editorial-dark transition-all disabled:opacity-50 flex items-center gap-1.5 text-[10px] uppercase font-sans tracking-wider font-bold"
            title="Use current GPS coordinates"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-editorial-forest" />}
            <span className="hidden md:inline">Use GPS</span>
          </button>
        </div>
      </div>

      {geoPromptBlocked && (
        <div id="weather-geo-blocked-notice" className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-none">
          <div className="flex gap-2 items-start sm:items-center">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="font-serif">
              <strong>Iframe Geolocation Blocked:</strong> Browsers restrict automatic GPS access inside iframe previews. You can easily search any global agricultural region or city using the search bar on the top-right.
            </span>
          </div>
          <a 
            href={window.location.href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-bold uppercase tracking-wider text-amber-900 underline hover:text-amber-950 flex-shrink-0"
          >
            Open in New Tab ↗
          </a>
        </div>
      )}

      {error && (
        <div id="weather-error-banner" className="p-3 bg-rose-50 border border-rose-150 text-xs text-rose-800 flex gap-2 items-center">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="font-serif">{error}</span>
        </div>
      )}

      {weather ? (
        <div id="weather-view-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Current State Column */}
          <div className="lg:col-span-5 bg-editorial-sand/20 border border-editorial-border/60 p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-widest font-bold text-editorial-sage bg-white border border-editorial-border/50 px-2.5 py-0.5">
                  Current
                </span>
                <h4 className="font-serif font-bold text-xl text-editorial-dark mt-2.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-editorial-forest flex-shrink-0" />
                  {weather.cityName}
                  {weather.country && <span className="text-xs font-sans text-editorial-sage">, {weather.country}</span>}
                </h4>
                <p className="text-[11px] text-editorial-sage font-mono mt-0.5">
                  Lat: {weather.latitude.toFixed(2)}° • Lng: {weather.longitude.toFixed(2)}°
                </p>
              </div>

              <div className="flex flex-col items-center">
                {weatherInfo?.icon}
                <span className="text-[10px] text-editorial-sage font-sans uppercase tracking-wider font-bold mt-1 text-center">
                  {weatherInfo?.desc}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-4 pt-2">
              <div className="flex items-center gap-1 text-editorial-dark">
                <Thermometer className="w-5 h-5 text-editorial-forest/70" />
                <span className="text-4xl font-serif font-bold tracking-tight">{weather.temperature}</span>
                <span className="text-lg font-serif">°C</span>
              </div>
              <div className="flex items-center gap-1 text-editorial-sage border-l border-editorial-border/60 pl-4">
                <Wind className="w-4 h-4" />
                <span className="text-xs font-mono">{weather.windspeed} km/h</span>
              </div>
            </div>
          </div>

          {/* Agricultural Advice Column */}
          <div className="lg:col-span-7 flex flex-col justify-between border border-editorial-border p-5 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  farmingAdvice?.severity === 'high' ? 'bg-rose-500 animate-pulse' :
                  farmingAdvice?.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <h5 className="font-serif font-bold text-sm text-editorial-dark uppercase tracking-wide">
                  {farmingAdvice?.title}
                </h5>
              </div>
              <p className="text-xs text-editorial-dark font-serif leading-relaxed italic">
                "{farmingAdvice?.advice}"
              </p>
            </div>

            <div className="bg-editorial-sand/30 border-t border-editorial-border/60 p-3 -mx-5 -mb-5 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-editorial-forest flex-shrink-0" />
              <p className="text-[10px] text-editorial-sage font-sans uppercase tracking-wider font-bold">
                Agricultural Sync: Synchronized with crop diagnostics and growth cycles
              </p>
            </div>
          </div>

          {/* 5-Day Micro-Forecast Panel */}
          <div className="lg:col-span-12 border-t border-editorial-border/40 pt-4">
            <h5 className="text-[10px] uppercase font-sans tracking-widest font-bold text-editorial-sage mb-3">
              5-Day Farming Outlook
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {weather.forecast.map((day, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-editorial-border p-3 flex flex-col items-center justify-between space-y-2"
                >
                  <span className="text-xs font-serif font-bold text-editorial-dark uppercase">
                    {day.date}
                  </span>
                  
                  {/* Miniature representation based on rain probability */}
                  {day.precipProb > 50 ? (
                    <CloudRain className="w-5 h-5 text-sky-500" />
                  ) : day.precipProb > 15 ? (
                    <CloudSun className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-amber-500" />
                  )}

                  <div className="text-center font-mono text-[11px] text-editorial-dark">
                    <span className="font-bold">{Math.round(day.tempMax)}°</span>
                    <span className="text-editorial-sage ml-1">/ {Math.round(day.tempMin)}°</span>
                  </div>

                  <div className="flex items-center gap-0.5 text-[9px] text-sky-600 font-sans font-bold uppercase tracking-wider">
                    <Droplets className="w-2.5 h-2.5" />
                    <span>{day.precipProb}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div id="weather-loading-spinner" className="flex flex-col items-center justify-center py-10 space-y-2">
          <RefreshCw className="w-8 h-8 text-editorial-forest animate-spin" />
          <p className="text-xs text-editorial-sage font-serif italic">Loading real-time microclimate coordinates...</p>
        </div>
      )}

      {geoPromptBlocked && (
        <p className="text-[9px] text-editorial-sage font-mono uppercase tracking-wider text-right">
          ℹ️ Geolocation permission was blocked. Displaying weather for Saskatchewan (Regina farming district). Use Search above for your city.
        </p>
      )}

    </div>
  );
}
