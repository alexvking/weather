
const GEO_API_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(type, params) {
    return `${type}:${JSON.stringify(params)}`;
}

function getCached(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`✅ Cache HIT for ${key}`);
        return cached.data;
    }
    if (cached) {
        console.log(`⏰ Cache EXPIRED for ${key}`);
        cache.delete(key);
    }
    return null;
}

function setCache(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
    console.log(`💾 Cached ${key}`);
}

export async function geoCode(query) {
    const cacheKey = getCacheKey('geo', query);
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const url = `${GEO_API_URL}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Geocoding failed');
        const data = await response.json();
        if (!data.results || data.results.length === 0) {
            throw new Error('Location not found');
        }
        const result = data.results[0];
        setCache(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Error fetching location:', error);
        throw error;
    }
}

export async function getWeather(lat, long) {
    const cacheKey = getCacheKey('weather', { lat, long });
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
        latitude: lat,
        longitude: long,
        daily: [
            'temperature_2m_max',
            'temperature_2m_min',
            'weather_code',
            'precipitation_sum',
            'precipitation_probability_max'
        ].join(','),
        hourly: [
            'temperature_2m',
            'apparent_temperature',
            'dew_point_2m',
            'precipitation_probability',
            'precipitation',
            'rain',
            'showers',
            'snowfall',
            'cloud_cover',
            'relative_humidity_2m',
            'surface_pressure',
            'wind_speed_10m',
            'wind_direction_10m'
        ].join(','),
        temperature_unit: 'fahrenheit',
        wind_speed_unit: 'mph',
        precipitation_unit: 'inch',
        timezone: 'auto',
        forecast_days: 10
    });

    const url = `${WEATHER_API_URL}?${params.toString()}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather fetch failed');
        const data = await response.json();
        setCache(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
}
