
export const ICONS = {
  // Clear / Sunny
  CLEAR_DAY: `
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="14" fill="#FFC107" stroke="#FF9800" stroke-width="2"/>
      <path d="M32 4V12M32 52V60M4 32H12M52 32H60M12.2 12.2L17.8 17.8M46.2 46.2L51.8 51.8M12.2 51.8L17.8 46.2M46.2 17.8L51.8 12.2" stroke="#FF9800" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `,

  // Cloudy
  CLOUDY: `
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M46 44H18C13.5817 44 10 40.4183 10 36C10 31.5817 13.5817 28 18 28C18.667 28 22 28 22 28C22.6186 23.4754 26.4947 20 31.1429 20C35.5398 20 39.2483 23.1091 40.0893 27.2882C40.6481 27.2289 41.2166 27.2 41.7922 27.2C47.315 27.2 51.7922 31.6771 51.7922 37.2C51.7922 42.7228 47.315 44 41.7922 44H46Z" fill="#B0BEC5" stroke="#78909C" stroke-width="2"/>
    </svg>
  `,

  // Partly Cloudy
  PARTLY_CLOUDY: `
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="26" r="10" fill="#FFC107" stroke="#FF9800" stroke-width="2"/>
       <path d="M46 46H24C20.6863 46 18 43.3137 18 40C18 36.6863 20.6863 34 24 34C24.5 34 27 34 27 34C27.464 30.6066 30.371 28 33.8571 28C37.1548 28 39.9362 30.3318 40.567 33.4662C40.9861 33.4216 41.4124 33.4 41.8442 33.4C45.9863 33.4 49.3442 36.7579 49.3442 40.9C49.3442 45.0421 45.9863 46 41.8442 46H46Z" fill="#ECEFF1" stroke="#90A4AE" stroke-width="2"/>
    </svg>
  `,

  // Rain
  RAIN: `
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M46 40H18C13.5817 40 10 36.4183 10 32C10 27.5817 13.5817 24 18 24C18.667 24 22 24 22 24C22.6186 19.4754 26.4947 16 31.1429 16C35.5398 16 39.2483 19.1091 40.0893 23.2882C40.6481 23.2289 41.2166 23.2 41.7922 23.2C47.315 23.2 51.7922 27.6771 51.7922 33.2C51.7922 38.7228 47.315 40 41.7922 40H46Z" fill="#90A4AE" stroke="#546E7A" stroke-width="2"/>
      <path d="M22 46L18 54M32 46L28 54M42 46L38 54" stroke="#4FC3F7" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `,

  // Snow
  SNOW: `
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M46 40H18C13.5817 40 10 36.4183 10 32C10 27.5817 13.5817 24 18 24C18.667 24 22 24 22 24C22.6186 19.4754 26.4947 16 31.1429 16C35.5398 16 39.2483 19.1091 40.0893 23.2882C40.6481 23.2289 41.2166 23.2 41.7922 23.2C47.315 23.2 51.7922 27.6771 51.7922 33.2C51.7922 38.7228 47.315 40 41.7922 40H46Z" fill="#ECEFF1" stroke="#B0BEC5" stroke-width="2"/>
      <path d="M22 46V54M32 46V54M42 46V54M18 50H26M28 50H36M38 50H46" stroke="#81D4FA" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `
};

export function getIcon(code) {
  // Simple mapping
  if (code === 0) return ICONS.CLEAR_DAY;
  if (code <= 3) return ICONS.PARTLY_CLOUDY; // 1, 2, 3
  if (code <= 48) return ICONS.CLOUDY; // 45, 48 (Fog included)
  if (code <= 57) return ICONS.RAIN; // Drizzle
  if (code <= 67) return ICONS.RAIN; // Rain
  if (code <= 77) return ICONS.SNOW; // Snow grains
  if (code <= 82) return ICONS.RAIN; // Showers
  if (code <= 86) return ICONS.SNOW; // Snow showers
  if (code >= 95) return ICONS.RAIN; // Thunderstorm (reusing rain for now, could add bolt)
  return ICONS.PARTLY_CLOUDY;
}

export function getWeatherLabel(code) {
  if (code === 0) return 'Sunny';
  if (code === 1) return 'Mostly Sunny';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 57) return 'Frz Drizzle';
  if (code <= 65) return 'Rain';
  if (code <= 67) return 'Frz Rain';
  if (code <= 77) return 'Snow Grains';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Unknown';
}
