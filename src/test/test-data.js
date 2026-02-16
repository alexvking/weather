
export const mockLocation = {
    name: 'Test City',
    admin1: 'WA',
    country_code: 'US',
    latitude: 47.6062,
    longitude: -122.3321,
    elevation: 100
};

export const mockDaily = {
    time: ['2023-10-01', '2023-10-02'],
    temperature_2m_max: [65, 60],
    temperature_2m_min: [50, 45],
    weather_code: [1, 71], // Partly cloudy, Snow
    precipitation_sum: [0, 0.5]
};

export const mockHourly = {
    time: Array(24).fill(0).map((_, i) => new Date(Date.now() + i * 3600000).toISOString()),
    temperature_2m: Array(24).fill(70),
    apparent_temperature: Array(24).fill(72),
    dew_point_2m: Array(24).fill(60),
    precipitation_probability: Array(24).fill(10),
    precipitation: Array(24).fill(0),
    rain: Array(24).fill(0),
    showers: Array(24).fill(0),
    snowfall: Array(24).fill(0),
    cloud_cover: Array(24).fill(50),
    relative_humidity_2m: Array(24).fill(40),
    surface_pressure: Array(24).fill(30),
    wind_speed_10m: Array(24).fill(10),
    wind_direction_10m: Array(24).fill(180)
};

export const mockHourlySnow = {
    ...mockHourly,
    snowfall: Array(24).fill(0.1), // Snow present
    precipitation_probability: Array(24).fill(80)
};
