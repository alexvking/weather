
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHeader, renderDailyForecast, renderCharts } from '../ui.js';
import { mockLocation, mockDaily, mockHourly } from './test-data.js';

// Mock Chart.js
vi.mock('chart.js/auto', () => {
    return {
        default: class {
            constructor() { }
            destroy() { }
        }
    };
});

describe('UI Rendering', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <h1 id="location-name"></h1>
      <span id="elevation"></span>
      <div id="daily-summary"></div>
      <canvas id="tempChart"></canvas>
      <canvas id="atmosphereChart"></canvas>
      <canvas id="precipAmountChart"></canvas>
      <canvas id="windChart"></canvas>
    `;

        // Mock Canvas Context
        const mockContext = {
            createLinearGradient: vi.fn(),
        };
        HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);
    });

    it('updates header with location info', () => {
        renderHeader(mockLocation);
        expect(document.getElementById('location-name')).toHaveTextContent('Test City, WA US');
        expect(document.getElementById('elevation')).toHaveTextContent('Elev: 100ft');
    });

    it('renders daily forecast cards', () => {
        renderDailyForecast({
            time: ['2023-10-01'],
            temperature_2m_max: [70],
            temperature_2m_min: [50],
            precipitation_sum: [0],
            weather_code: [1]
        });
        const cards = document.querySelectorAll('.day-card');
        expect(cards).toHaveLength(1);
        expect(cards[0]).toHaveTextContent('70°');
        expect(cards[0]).toHaveTextContent('50°');
        expect(cards[0]).toHaveTextContent('Mostly Sunny'); // Check text summary
    });

    it('initializes charts without error', () => {
        const mockHourly = {
            time: Array(24).fill(0).map((_, i) => new Date(Date.now() + i * 3600000).toISOString()),
            temperature_2m: Array(24).fill(70),
            apparent_temperature: Array(24).fill(72),
            dew_point_2m: Array(24).fill(60),
            precipitation_probability: Array(24).fill(10),
            precipitation: Array(24).fill(0),
            cloud_cover: Array(24).fill(50),
            relative_humidity_2m: Array(24).fill(40),
            surface_pressure: Array(24).fill(30),
            wind_speed_10m: Array(24).fill(10),
            rain: Array(24).fill(0),
            showers: Array(24).fill(0),
            snowfall: Array(24).fill(0)
        };
        // Pass mock offset (0)
        expect(() => renderCharts(mockHourly, 0)).not.toThrow();
    });
});
